import prisma from '../config/database';
import { ProductChat, ProductMessage, StartChatData, SendMessageData, MessageType, SellerChatSettings } from '../types';

export class ProductChatService {
  /**
   * Start a new chat for a product or get existing chat
   */
  static async startOrGetChat(
    buyerId: string,
    productId: string,
    initialMessage?: string
  ): Promise<ProductChat> {
    // Check if product exists and get seller info
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        seller: {
          select: {
            id: true,
            userId: true,
            shopName: true
          }
        }
      }
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.isActive) {
      throw new Error('Product is not available for chat');
    }

    // Check if chat already exists
    let existingChat = await prisma.productChat.findUnique({
      where: {
        productId_buyerId: {
          productId,
          buyerId
        }
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true
          }
        },
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        messages: {
          include: {
            sender: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (existingChat) {
      // Reactivate chat if it was inactive
      if (!existingChat.isActive) {
        existingChat = await prisma.productChat.update({
          where: { id: existingChat.id },
          data: { isActive: true },
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                images: true
              }
            },
            buyer: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            },
            seller: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            messages: {
              include: {
                sender: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              },
              orderBy: {
                createdAt: 'asc'
              }
            }
          }
        });
      }
      
      return existingChat as ProductChat;
    }

    // Create new chat
    const newChat = await prisma.productChat.create({
      data: {
        productId,
        buyerId,
        sellerId: product.seller.userId // Use User ID from Seller's userId field
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true
          }
        },
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        messages: {
          include: {
            sender: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    // Send initial message if provided
    if (initialMessage && initialMessage.trim()) {
      await this.sendMessage(newChat.id, buyerId, initialMessage.trim());
    }

    // Get chat with messages
    const chatWithMessages = await prisma.productChat.findUnique({
      where: { id: newChat.id },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true
          }
        },
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        messages: {
          include: {
            sender: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    return chatWithMessages as ProductChat;
  }

  /**
   * Send a message in an existing chat
   */
  static async sendMessage(
    chatId: string,
    senderId: string,
    message: string,
    messageType: MessageType = MessageType.TEXT
  ): Promise<ProductMessage> {
    // Verify chat exists and sender is part of it
    const chat = await prisma.productChat.findUnique({
      where: { id: chatId },
      select: {
        buyerId: true,
        sellerId: true,
        isActive: true
      }
    });

    if (!chat) {
      throw new Error('Chat not found');
    }

    if (!chat.isActive) {
      throw new Error('Chat is no longer active');
    }

    const validParticipants = [chat.buyerId, chat.sellerId];
    if (!validParticipants.includes(senderId)) {
      throw new Error('You are not authorized to send messages in this chat');
    }

    // Create the message
    const newMessage = await prisma.productMessage.create({
      data: {
        chatId,
        senderId,
        message: message.trim(),
        messageType
      },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Update chat timestamp
    await prisma.productChat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() }
    });

    return newMessage as ProductMessage;
  }

  /**
   * Get chat by ID with messages
   */
  static async getChatById(chatId: string, userId: string): Promise<ProductChat> {
    const chat = await prisma.productChat.findUnique({
      where: { id: chatId },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true
          }
        },
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        messages: {
          include: {
            sender: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!chat) {
      throw new Error('Chat not found');
    }

    // Verify user is part of the chat
    const validParticipants = [chat.buyerId, chat.sellerId];
    if (!validParticipants.includes(userId)) {
      throw new Error('You are not authorized to view this chat');
    }

    // Mark messages as read for the current user
    await prisma.productMessage.updateMany({
      where: {
        chatId,
        senderId: { not: userId },
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    return chat as ProductChat;
  }

  /**
   * Get all chats for a user (buyer or seller)
   */
  static async getUserChats(userId: string): Promise<ProductChat[]> {
    const chats = await prisma.productChat.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { sellerId: userId }
        ],
        isActive: true
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true
          }
        },
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            sender: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: userId },
                isRead: false
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return chats.map(chat => ({
      ...chat,
      unreadCount: (chat as any)._count?.messages || 0
    })) as ProductChat[];
  }

  /**
   * Get unread message count for user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const count = await prisma.productMessage.count({
      where: {
        chat: {
          OR: [
            { buyerId: userId },
            { sellerId: userId }
          ]
        },
        senderId: { not: userId },
        isRead: false
      }
    });

    return count;
  }

  /**
   * Mark all messages in a chat as read
   */
  static async markChatAsRead(chatId: string, userId: string): Promise<void> {
    // Verify user is part of the chat
    const chat = await prisma.productChat.findUnique({
      where: { id: chatId },
      select: {
        buyerId: true,
        sellerId: true
      }
    });

    if (!chat) {
      throw new Error('Chat not found');
    }

    const validParticipants = [chat.buyerId, chat.sellerId];
    if (!validParticipants.includes(userId)) {
      throw new Error('You are not authorized to access this chat');
    }

    await prisma.productMessage.updateMany({
      where: {
        chatId,
        senderId: { not: userId },
        isRead: false
      },
      data: {
        isRead: true
      }
    });
  }

  /**
   * Get or create seller chat settings
   */
  static async getSellerChatSettings(sellerId: string): Promise<SellerChatSettings> {
    let settings = await prisma.sellerChatSettings.findUnique({
      where: { sellerId }
    });

    if (!settings) {
      settings = await prisma.sellerChatSettings.create({
        data: {
          sellerId,
          showPhone: false,
          isOnline: false
        }
      });
    }

    return settings as SellerChatSettings;
  }

  /**
   * Update seller chat settings
   */
  static async updateSellerChatSettings(
    sellerId: string,
    updates: Partial<SellerChatSettings>
  ): Promise<SellerChatSettings> {
    const settings = await prisma.sellerChatSettings.upsert({
      where: { sellerId },
      update: updates,
      create: {
        sellerId,
        showPhone: updates.showPhone ?? false,
        autoReplyText: updates.autoReplyText,
        isOnline: updates.isOnline ?? false,
        lastSeen: updates.lastSeen
      }
    });

    return settings as SellerChatSettings;
  }

  /**
   * Set seller online status
   */
  static async setSellerOnlineStatus(sellerId: string, isOnline: boolean): Promise<void> {
    await prisma.sellerChatSettings.upsert({
      where: { sellerId },
      update: {
        isOnline,
        lastSeen: isOnline ? null : new Date()
      },
      create: {
        sellerId,
        isOnline,
        lastSeen: isOnline ? null : new Date(),
        showPhone: false
      }
    });
  }
}
