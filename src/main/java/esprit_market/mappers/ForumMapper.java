package esprit_market.mappers;

import esprit_market.dto.forum.*;
import esprit_market.entity.forum.*;
import org.bson.types.ObjectId;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public final class ForumMapper {

    private ForumMapper() {}

    public static String toId(ObjectId id) {
        return id == null ? null : id.toHexString();
    }

    public static ObjectId toObjectId(String id) {
        return id == null || id.isBlank() ? null : new ObjectId(id);
    }

    public static List<String> toIdList(List<ObjectId> ids) {
        if (ids == null) return Collections.emptyList();
        return ids.stream().map(ObjectId::toHexString).collect(Collectors.toList());
    }

    public static List<ObjectId> toObjectIdList(List<String> ids) {
        if (ids == null) return Collections.emptyList();
        return ids.stream()
                .filter(id -> id != null && !id.isBlank())
                .map(ObjectId::new)
                .collect(Collectors.toList());
    }

    // CategoryForum
    public static CategoryForumDto toCategoryForumDto(CategoryForum e) {
        if (e == null) return null;
        return CategoryForumDto.builder()
                .id(toId(e.getId()))
                .name(e.getName())
                .description(e.getDescription())
                .build();
    }

    public static CategoryForum toCategoryForum(CreateCategoryForumDto dto) {
        if (dto == null) return null;
        return CategoryForum.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .build();
    }

    // Group
    public static GroupDto toGroupDto(Group e) {
        if (e == null) return null;
        return GroupDto.builder()
                .id(toId(e.getId()))
                .name(e.getName())
                .topic(e.getTopic())
                .level(e.getLevel())
                .speciality(e.getSpeciality())
                .memberIds(toIdList(e.getMemberIds()))
                .messageIds(toIdList(e.getMessageIds()))
                .build();
    }

    public static Group toGroup(CreateGroupDto dto) {
        if (dto == null) return null;
        return Group.builder()
                .name(dto.getName())
                .topic(dto.getTopic())
                .level(dto.getLevel())
                .speciality(dto.getSpeciality())
                .memberIds(toObjectIdList(dto.getMemberIds()))
                .messageIds(Collections.emptyList())
                .build();
    }

    // Post
    public static PostDto toPostDto(Post e) {
        if (e == null) return null;
        return PostDto.builder()
                .id(toId(e.getId()))
                .userId(toId(e.getUserId()))
                .categoryId(toId(e.getCategoryId()))
                .content(e.getContent())
                .createdAt(e.getCreatedAt())
                .pinned(e.isPinned())
                .approved(e.isApproved())
                .commentIds(toIdList(e.getCommentIds()))
                .reactionIds(toIdList(e.getReactionIds()))
                .build();
    }

    public static Post toPost(CreatePostDto dto) {
        if (dto == null) return null;
        return Post.builder()
                .userId(toObjectId(dto.getUserId()))
                .categoryId(toObjectId(dto.getCategoryId()))
                .content(dto.getContent())
                .createdAt(LocalDateTime.now())
                .isPinned(false)
                .isApproved(false)
                .commentIds(Collections.emptyList())
                .reactionIds(Collections.emptyList())
                .build();
    }

    // Comment
    public static CommentDto toCommentDto(Comment e) {
        if (e == null) return null;
        return CommentDto.builder()
                .id(toId(e.getId()))
                .postId(toId(e.getPostId()))
                .userId(toId(e.getUserId()))
                .parentCommentId(toId(e.getParentCommentId()))
                .content(e.getContent())
                .createdAt(e.getCreatedAt())
                .reactionIds(toIdList(e.getReactionIds()))
                .build();
    }

    public static Comment toComment(CreateCommentDto dto) {
        if (dto == null) return null;
        return Comment.builder()
                .postId(toObjectId(dto.getPostId()))
                .userId(toObjectId(dto.getUserId()))
                .parentCommentId(toObjectId(dto.getParentCommentId()))
                .content(dto.getContent())
                .createdAt(LocalDateTime.now())
                .reactionIds(Collections.emptyList())
                .build();
    }

    // Message
    public static MessageDto toMessageDto(Message e) {
        if (e == null) return null;
        return MessageDto.builder()
                .id(toId(e.getId()))
                .senderId(toId(e.getSenderId()))
                .groupId(toId(e.getGroupId()))
                .receiverId(toId(e.getReceiverId()))
                .replyToMessageId(toId(e.getReplyToMessageId()))
                .content(e.getContent())
                .timestamp(e.getTimestamp())
                .build();
    }

    public static Message toMessage(CreateMessageDto dto) {
        if (dto == null) return null;
        return Message.builder()
                .senderId(toObjectId(dto.getSenderId()))
                .groupId(toObjectId(dto.getGroupId()))
                .receiverId(toObjectId(dto.getReceiverId()))
                .replyToMessageId(toObjectId(dto.getReplyToMessageId()))
                .content(dto.getContent())
                .timestamp(LocalDateTime.now())
                .build();
    }

    // Reply
    public static ReplyDto toReplyDto(Reply e) {
        if (e == null) return null;
        return ReplyDto.builder()
                .id(toId(e.getId()))
                .commentId(toId(e.getCommentId()))
                .userId(toId(e.getUserId()))
                .content(e.getContent())
                .createdAt(e.getCreatedAt())
                .build();
    }

    public static Reply toReply(CreateReplyDto dto) {
        if (dto == null) return null;
        return Reply.builder()
                .commentId(toObjectId(dto.getCommentId()))
                .userId(toObjectId(dto.getUserId()))
                .content(dto.getContent())
                .createdAt(LocalDateTime.now())
                .build();
    }

    // Reaction
    public static ReactionDto toReactionDto(Reaction e) {
        if (e == null) return null;
        return ReactionDto.builder()
                .id(toId(e.getId()))
                .type(e.getType() == null ? null : e.getType().name())
                .userId(toId(e.getUserId()))
                .postId(toId(e.getPostId()))
                .commentId(toId(e.getCommentId()))
                .createdAt(e.getCreatedAt())
                .build();
    }

    public static Reaction toReaction(CreateReactionDto dto) {
        if (dto == null) return null;
        ReactionType type = null;
        if (dto.getType() != null && !dto.getType().isBlank()) {
            try {
                type = ReactionType.valueOf(dto.getType().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }
        return Reaction.builder()
                .type(type)
                .userId(toObjectId(dto.getUserId()))
                .postId(toObjectId(dto.getPostId()))
                .commentId(toObjectId(dto.getCommentId()))
                .createdAt(LocalDateTime.now())
                .build();
    }
}
