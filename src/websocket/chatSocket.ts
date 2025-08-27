import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import { ProductChatService } from '../services/productChatService';
import { UserRole, JwtPayload } from '../types';
import prisma from '../config/database';

interface SocketUser {
  userId: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

export class ChatSocketManager {
  private io: Server;
  private connectedUsers: Map<string, SocketUser & { socketId: string }> = new Map();

  constructor(httpServer: any) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.setupSocketHandlers();
    console.log('📡 WebSocket Chat Server initialized');
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`🔌 New socket connection: ${socket.id}`);

      // Authentication middleware
      socket.on('authenticate', async (token: string) => {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
          
          // Here you would normally fetch user details from database
          // For now, we'll use the JWT payload
          const user: SocketUser = {
            userId: decoded.userId,
            role: decoded.role,
            firstName: 'User', // You'd get this from DB
            lastName: `${decoded.role}` // You'd get this from DB
          };

          socket.user = user;
          
          // Store connected user
          this.connectedUsers.set(socket.id, {
            ...user,
            socketId: socket.id
          });

          // Join user-specific room
          socket.join(`user_${user.userId}`);

          // Update seller online status if seller
          if (user.role === UserRole.SELLER) {
            try {
              // Get the seller record to get the actual seller ID
              const seller = await prisma.seller.findUnique({
                where: { userId: user.userId }
              });
              
              if (seller) {
                await ProductChatService.setSellerOnlineStatus(seller.id, true);
              }
            } catch (sellerError) {
              console.error('❌ Failed to update seller online status:', sellerError);
              // Don't fail authentication for this
            }
          }

          socket.emit('authenticated', { success: true, user });
          console.log(`✅ User authenticated: ${user.userId} (${user.role})`);

        } catch (error) {
          console.error('❌ Authentication failed:', error);
          socket.emit('authentication_error', { message: 'Invalid token' });
          socket.disconnect();
        }
      });

      // Join product chat room
      socket.on('join_product_chat', (data: { productId: string }) => {
        if (!socket.user) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const roomName = `product_${data.productId}`;
        socket.join(roomName);
        console.log(`👥 User ${socket.user.userId} joined product chat: ${data.productId}`);
      });

      // Send message
      socket.on('send_message', async (messageData: {
        chatId: string;
        productId: string;
        message: string;
        messageType?: string;
      }) => {
        if (!socket.user) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        try {
          // Save message to database
          const newMessage = await ProductChatService.sendMessage(
            messageData.chatId,
            socket.user.userId,
            messageData.message,
            messageData.messageType as any
          );

          // Emit to all users in the product chat room
          const roomName = `product_${messageData.productId}`;
          this.io.to(roomName).emit('new_message', {
            chatId: messageData.chatId,
            message: newMessage
          });

          // Send push notification to offline users
          await this.sendNotificationToOfflineUsers(messageData.chatId, newMessage);

          console.log(`📨 Message sent in chat ${messageData.chatId} by ${socket.user.userId}`);

        } catch (error: any) {
          console.error('❌ Failed to send message:', error);
          socket.emit('message_error', { 
            message: error.message || 'Failed to send message' 
          });
        }
      });

      // Typing indicators
      socket.on('typing_start', (data: { chatId: string; productId: string }) => {
        if (!socket.user) return;

        const roomName = `product_${data.productId}`;
        socket.to(roomName).emit('user_typing', {
          chatId: data.chatId,
          userId: socket.user.userId,
          userName: `${socket.user.firstName} ${socket.user.lastName}`,
          isTyping: true
        });
      });

      socket.on('typing_stop', (data: { chatId: string; productId: string }) => {
        if (!socket.user) return;

        const roomName = `product_${data.productId}`;
        socket.to(roomName).emit('user_typing', {
          chatId: data.chatId,
          userId: socket.user.userId,
          userName: `${socket.user.firstName} ${socket.user.lastName}`,
          isTyping: false
        });
      });

      // Mark messages as read
      socket.on('mark_as_read', async (data: { chatId: string }) => {
        if (!socket.user) return;

        try {
          await ProductChatService.markChatAsRead(data.chatId, socket.user.userId);
          
          // Notify other participants that messages are read
          socket.to(`chat_${data.chatId}`).emit('messages_read', {
            chatId: data.chatId,
            readBy: socket.user.userId
          });

        } catch (error) {
          console.error('❌ Failed to mark as read:', error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        if (socket.user) {
          console.log(`👋 User disconnected: ${socket.user.userId}`);
          
          // Update seller offline status
          if (socket.user.role === UserRole.SELLER) {
            try {
              // Get the seller record to get the actual seller ID
              const seller = await prisma.seller.findUnique({
                where: { userId: socket.user.userId }
              });
              
              if (seller) {
                await ProductChatService.setSellerOnlineStatus(seller.id, false);
              }
            } catch (sellerError) {
              console.error('❌ Failed to update seller offline status:', sellerError);
            }
          }

          // Remove from connected users
          this.connectedUsers.delete(socket.id);
        }
        
        console.log(`🔌 Socket disconnected: ${socket.id}`);
      });

      // Error handling
      socket.on('error', (error) => {
        console.error(`❌ Socket error for ${socket.id}:`, error);
      });
    });
  }

  /**
   * Send notification to offline users
   */
  private async sendNotificationToOfflineUsers(chatId: string, message: any) {
    try {
      // Get chat participants
      const chat = await ProductChatService.getChatById(chatId, message.senderId);
      
      const participants = [chat.buyerId, chat.sellerId];
      const offlineUsers = participants.filter(userId => 
        userId !== message.senderId && !this.isUserOnline(userId)
      );

      // Here you would integrate with a push notification service
      // For now, we'll just log it
      if (offlineUsers.length > 0) {
        console.log(`📱 Would send push notification to offline users: ${offlineUsers.join(', ')}`);
        // TODO: Integrate with Firebase, Pusher, or other push notification service
      }

    } catch (error) {
      console.error('❌ Failed to send offline notifications:', error);
    }
  }

  /**
   * Check if user is online
   */
  private isUserOnline(userId: string): boolean {
    for (const [_, user] of this.connectedUsers) {
      if (user.userId === userId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get online users count
   */
  public getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get connected users
   */
  public getConnectedUsers(): Array<SocketUser & { socketId: string }> {
    return Array.from(this.connectedUsers.values());
  }

  /**
   * Send notification to specific user
   */
  public sendToUser(userId: string, event: string, data: any): void {
    this.io.to(`user_${userId}`).emit(event, data);
  }

  /**
   * Broadcast to all connected users
   */
  public broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }
}
