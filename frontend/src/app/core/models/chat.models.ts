export interface ChatUser {
  id: string;
  fullName: string;
  profileImage?: string;
}

export interface ChatMessage {
  id?: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
}

export interface ChatConversation {
  id?: string;
  conversationId: string;
  user1Id: string;
  user2Id: string;
  flameLevel: number;
  lastFlameDate?: string;
  user1SentToday: boolean;
  user2SentToday: boolean;
  lastMessageDate: string;
  lastMessageContent: string;
  
  // Custom property for UI
  otherUser?: ChatUser;
}

export interface ChatMessagePayload {
  senderId: string;
  receiverId: string;
  content: string;
  conversationId?: string;
  timestamp?: string;
}
