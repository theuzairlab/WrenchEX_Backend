import { Request, Response } from 'express';
import { ProductChatService } from '../services/productChatService';
import { ApiResponse } from '../types';
import WebSocketService from '../services/websocketService';

export class ProductChatController {
  /**
   * Start a chat for a product
   * POST /api/chat/product/:productId/start
   */
  static async startChat(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const buyerId = req.user!.id;
      const { message } = req.body;

      const chat = await ProductChatService.startOrGetChat(buyerId, productId, message);

      const response: ApiResponse<any> = {
        success: true,
        data: { chat }
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to start chat'
        }
      };

      res.status(400).json(response);
    }
  }

  /**
   * Send a message in a chat
   * POST /api/chat/:chatId/send
   */
  static async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;
      const senderId = req.user!.id;
      const { message, messageType } = req.body;

      if (!message || !message.trim()) {
        const response: ApiResponse<null> = {
          success: false,
          error: { message: 'Message content is required' }
        };
        res.status(400).json(response);
        return;
      }

      const newMessage = await ProductChatService.sendMessage(
        chatId,
        senderId,
        message.trim(),
        messageType
      );

      // Emit unread count update via WebSocket for the recipient
      try {
        // Get the chat to find the recipient
        const chat = await ProductChatService.getChatById(chatId, senderId);
        const recipientId = chat.buyerId === senderId ? chat.sellerId : chat.buyerId;
        
        await WebSocketService.getInstance().emitUnreadCountToUser(recipientId);
      } catch (wsError) {
        console.error('Failed to emit WebSocket update:', wsError);
        // Don't fail the request for WebSocket errors
      }

      const response: ApiResponse<any> = {
        success: true,
        data: { message: newMessage }
      };

      res.status(201).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to send message'
        }
      };

      res.status(400).json(response);
    }
  }

  /**
   * Get chat by ID with messages
   * GET /api/chat/:chatId
   */
  static async getChatById(req: Request, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;
      const userId = req.user!.id;

      const chat = await ProductChatService.getChatById(chatId, userId);

      const response: ApiResponse<any> = {
        success: true,
        data: { chat }
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to get chat'
        }
      };

      const statusCode = error.message.includes('not found') ? 404 : 
                        error.message.includes('not authorized') ? 403 : 400;

      res.status(statusCode).json(response);
    }
  }

  /**
   * Get all chats for current user
   * GET /api/chat/conversations
   */
  static async getUserChats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const chats = await ProductChatService.getUserChats(userId);

      const response: ApiResponse<any> = {
        success: true,
        data: { chats }
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to get chats'
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get unread message count
   * GET /api/chat/unread-count
   */
  static async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const count = await ProductChatService.getUnreadCount(userId);

      const response: ApiResponse<{ count: number }> = {
        success: true,
        data: { count }
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to get unread count'
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Mark chat as read
   * PUT /api/chat/:chatId/read
   */
  static async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;
      const userId = req.user!.id;

      await ProductChatService.markChatAsRead(chatId, userId);

      // Emit unread count update via WebSocket
      try {
        await WebSocketService.getInstance().emitUnreadCountToUser(userId);
      } catch (wsError) {
        console.error('Failed to emit WebSocket update:', wsError);
        // Don't fail the request for WebSocket errors
      }

      const response: ApiResponse<null> = {
        success: true
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to mark chat as read'
        }
      };

      res.status(400).json(response);
    }
  }

  /**
   * Get seller chat settings
   * GET /api/chat/seller/settings
   */
  static async getSellerSettings(req: Request, res: Response): Promise<void> {
    try {
      const sellerId = req.user!.id;

      const settings = await ProductChatService.getSellerChatSettings(sellerId);

      const response: ApiResponse<any> = {
        success: true,
        data: { settings }
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to get seller settings'
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Update seller chat settings
   * PUT /api/chat/seller/settings
   */
  static async updateSellerSettings(req: Request, res: Response): Promise<void> {
    try {
      const sellerId = req.user!.id;
      const updates = req.body;

      const settings = await ProductChatService.updateSellerChatSettings(sellerId, updates);

      const response: ApiResponse<any> = {
        success: true,
        data: { settings }
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to update seller settings'
        }
      };

      res.status(400).json(response);
    }
  }

  /**
   * Set seller online status
   * POST /api/chat/seller/online-status
   */
  static async setOnlineStatus(req: Request, res: Response): Promise<void> {
    try {
      const sellerId = req.user!.id;
      const { isOnline } = req.body;

      if (typeof isOnline !== 'boolean') {
        const response: ApiResponse<null> = {
          success: false,
          error: { message: 'isOnline must be a boolean value' }
        };
        res.status(400).json(response);
        return;
      }

      await ProductChatService.setSellerOnlineStatus(sellerId, isOnline);

      const response: ApiResponse<null> = {
        success: true
      };

      res.status(200).json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: error.message || 'Failed to update online status'
        }
      };

      res.status(400).json(response);
    }
  }
}
