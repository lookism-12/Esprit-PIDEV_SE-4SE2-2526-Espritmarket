import { User } from './user.model';

// Forum Models
export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  postCount: number;
  lastPost?: PostSummary;
  isLocked: boolean;
  sortOrder: number;
  createdAt: Date;
}

export interface Post {
  id: string;
  categoryId: string;
  category: Pick<ForumCategory, 'id' | 'name' | 'slug' | 'icon' | 'color'>;
  authorId: string;
  author: PostAuthor;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  tags: string[];
  attachments: PostAttachment[];
  status: PostStatus;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  commentCount: number;
  reactions: ReactionSummary;
  userReaction?: ReactionType;
  moderationBadge?: ModerationBadge;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
}

export interface PostAuthor {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: string;
  reputation: number;
  postCount: number;
  joinedAt: Date;
}

export interface PostSummary {
  id: string;
  title: string;
  authorName: string;
  createdAt: Date;
}

export interface PostAttachment {
  id: string;
  type: 'image' | 'file' | 'link';
  url: string;
  name: string;
  size?: number;
}

export enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  HIDDEN = 'HIDDEN',
  FLAGGED = 'FLAGGED',
  DELETED = 'DELETED'
}

export enum ModerationBadge {
  VERIFIED = 'VERIFIED',
  OFFICIAL = 'OFFICIAL',
  PINNED = 'PINNED',
  TRENDING = 'TRENDING',
  BEST_ANSWER = 'BEST_ANSWER',
  EXPERT = 'EXPERT'
}

// Comments
export interface Comment {
  id: string;
  postId: string;
  parentId?: string;
  authorId: string;
  author: PostAuthor;
  content: string;
  attachments: PostAttachment[];
  reactions: ReactionSummary;
  userReaction?: ReactionType;
  isEdited: boolean;
  isBestAnswer: boolean;
  replies?: Comment[];
  replyCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Reactions
export enum ReactionType {
  LIKE = 'LIKE',
  LOVE = 'LOVE',
  HELPFUL = 'HELPFUL',
  INSIGHTFUL = 'INSIGHTFUL',
  FUNNY = 'FUNNY',
  FLAME = 'FLAME'
}

export interface ReactionSummary {
  total: number;
  likes: number;
  loves: number;
  helpful: number;
  insightful: number;
  funny: number;
}

// Groups & Collaboration
export interface Group {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatar?: string;
  coverImage?: string;
  type: GroupType;
  privacy: GroupPrivacy;
  ownerId: string;
  owner: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
  memberCount: number;
  postCount: number;
  tags: string[];
  rules?: string;
  isMember: boolean;
  memberRole?: GroupMemberRole;
  createdAt: Date;
}

export enum GroupType {
  STUDY = 'STUDY',
  PROJECT = 'PROJECT',
  CLUB = 'CLUB',
  DEPARTMENT = 'DEPARTMENT',
  INTEREST = 'INTEREST',
  OTHER = 'OTHER'
}

export enum GroupPrivacy {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  SECRET = 'SECRET'
}

export enum GroupMemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER'
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
  role: GroupMemberRole;
  joinedAt: Date;
}

// Chat Models
export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string;
  avatar?: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum ConversationType {
  PRIVATE = 'PRIVATE',
  GROUP = 'GROUP',
  SUPPORT = 'SUPPORT'
}

export interface ConversationParticipant {
  userId: string;
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
  role: 'admin' | 'member';
  joinedAt: Date;
  lastSeenAt?: Date;
  isOnline: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
  content: string;
  type: MessageType;
  attachments: MessageAttachment[];
  replyTo?: Message;
  isEdited: boolean;
  isDeleted: boolean;
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
  VOICE = 'VOICE'
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'file' | 'voice';
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

// Request DTOs
export interface CreatePostRequest {
  categoryId: string;
  title: string;
  content: string;
  tags?: string[];
  attachments?: string[];
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  tags?: string[];
}

export interface CreateCommentRequest {
  postId: string;
  parentId?: string;
  content: string;
  attachments?: string[];
}

export interface CreateGroupRequest {
  name: string;
  description: string;
  type: GroupType;
  privacy: GroupPrivacy;
  tags?: string[];
  avatar?: string;
  coverImage?: string;
  rules?: string;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  type?: MessageType;
  attachments?: string[];
  replyToId?: string;
}

export interface CreateConversationRequest {
  type: ConversationType;
  participantIds: string[];
  name?: string;
  initialMessage?: string;
}

// Filter & Response Types
export interface PostFilter {
  categoryId?: string;
  authorId?: string;
  tags?: string[];
  status?: PostStatus;
  search?: string;
  sortBy?: 'recent' | 'popular' | 'comments';
  page?: number;
  limit?: number;
}

export interface PostListResponse {
  posts: Post[];
  total: number;
  page: number;
  totalPages: number;
}

export interface GroupFilter {
  type?: GroupType;
  privacy?: GroupPrivacy;
  search?: string;
  isMember?: boolean;
  page?: number;
  limit?: number;
}

export interface GroupListResponse {
  groups: Group[];
  total: number;
  page: number;
  totalPages: number;
}
