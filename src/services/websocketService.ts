import { ChatSocketManager } from '../websocket/chatSocket';

class WebSocketService {
  private static instance: WebSocketService;
  private chatSocketManager: ChatSocketManager | null = null;

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  setChatSocketManager(chatSocketManager: ChatSocketManager): void {
    this.chatSocketManager = chatSocketManager;
  }

  getChatSocketManager(): ChatSocketManager | null {
    return this.chatSocketManager;
  }

  async emitUnreadCountToUser(userId: string): Promise<void> {
    if (this.chatSocketManager) {
      await this.chatSocketManager.emitUnreadCountToUser(userId);
    }
  }

  async emitUnreadCountUpdate(chatId: string): Promise<void> {
    if (this.chatSocketManager) {
      // Access the private method through a public interface
      // We'll need to make this method public in ChatSocketManager
      await this.chatSocketManager.emitUnreadCountUpdate(chatId);
    }
  }
}

export default WebSocketService;
