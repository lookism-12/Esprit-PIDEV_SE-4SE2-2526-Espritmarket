package esprit_market.service.forumService;

import esprit_market.dto.forum.GroupRequest;
import esprit_market.entity.forum.Group;
import esprit_market.repository.forumRepository.GroupRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Group Service Tests")
class GroupServiceTest {

    @Mock
    private GroupRepository groupRepository;

    @InjectMocks
    private GroupService groupService;

    private GroupRequest groupRequest;
    private Group group;
    private String groupId;
    private String memberId1;
    private String memberId2;

    @BeforeEach
    void setUp() {
        groupId = new ObjectId().toHexString();
        memberId1 = new ObjectId().toHexString();
        memberId2 = new ObjectId().toHexString();

        groupRequest = GroupRequest.builder()
                .name("Java Developers")
                .topic("Java")
                .level("Advanced")
                .speciality("Backend")
                .memberIds(List.of(memberId1, memberId2))
                .build();

        group = Group.builder()
                .id(new ObjectId(groupId))
                .name("Java Developers")
                .topic("Java")
                .level("Advanced")
                .speciality("Backend")
                .memberIds(List.of(new ObjectId(memberId1), new ObjectId(memberId2)))
                .messageIds(new ArrayList<>())
                .build();
    }

    @Test
    @DisplayName("Should create a group successfully")
    void testCreateGroup() {
        // Arrange
        when(groupRepository.save(any(Group.class))).thenReturn(group);

        // Act
        Group result = groupService.create(groupRequest);

        // Assert
        assertNotNull(result);
        assertEquals(group.getName(), result.getName());
        assertEquals(2, result.getMemberIds().size());
        verify(groupRepository, times(1)).save(any(Group.class));
    }

    @Test
    @DisplayName("Should throw exception when creating group with less than 2 members")
    void testCreateGroupWithInsufficientMembers() {
        // Arrange
        GroupRequest invalidRequest = GroupRequest.builder()
                .name("Small Group")
                .topic("Java")
                .level("Advanced")
                .speciality("Backend")
                .memberIds(List.of(memberId1))
                .build();

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> groupService.create(invalidRequest));
    }

    @Test
    @DisplayName("Should retrieve group by ID")
    void testGetGroupById() {
        // Arrange
        when(groupRepository.findById(new ObjectId(groupId))).thenReturn(Optional.of(group));

        // Act
        Group result = groupService.findById(new ObjectId(groupId));

        // Assert
        assertNotNull(result);
        assertEquals(groupId, result.getId().toHexString());
        verify(groupRepository, times(1)).findById(any(ObjectId.class));
    }

    @Test
    @DisplayName("Should return null when group not found")
    void testGetGroupByIdNotFound() {
        // Arrange
        when(groupRepository.findById(any(ObjectId.class))).thenReturn(Optional.empty());

        // Act
        Group result = groupService.findById(new ObjectId());

        // Assert
        assertNull(result);
        verify(groupRepository, times(1)).findById(any(ObjectId.class));
    }

    @Test
    @DisplayName("Should update group successfully")
    void testUpdateGroup() {
        // Arrange
        GroupRequest updateRequest = GroupRequest.builder()
                .name("Updated Group")
                .topic("Kotlin")
                .level("Intermediate")
                .speciality("Full Stack")
                .memberIds(List.of(memberId1, memberId2))
                .build();

        Group updatedGroup = Group.builder()
                .id(group.getId())
                .name("Updated Group")
                .topic("Kotlin")
                .level("Intermediate")
                .speciality("Full Stack")
                .memberIds(group.getMemberIds())
                .messageIds(group.getMessageIds())
                .build();

        when(groupRepository.findById(new ObjectId(groupId))).thenReturn(Optional.of(group));
        when(groupRepository.save(any(Group.class))).thenReturn(updatedGroup);

        // Act
        Group result = groupService.update(new ObjectId(groupId), updateRequest);

        // Assert
        assertNotNull(result);
        assertEquals("Updated Group", result.getName());
        verify(groupRepository, times(1)).findById(any(ObjectId.class));
        verify(groupRepository, times(1)).save(any(Group.class));
    }

    @Test
    @DisplayName("Should delete group successfully")
    void testDeleteGroup() {
        // Arrange
        doNothing().when(groupRepository).deleteById(any(ObjectId.class));

        // Act
        groupService.deleteById(new ObjectId(groupId));

        // Assert
        verify(groupRepository, times(1)).deleteById(any(ObjectId.class));
    }

    @Test
    @DisplayName("Should retrieve all groups")
    void testGetAllGroups() {
        // Arrange
        List<Group> groups = List.of(group);
        when(groupRepository.findAll()).thenReturn(groups);

        // Act
        List<Group> result = groupService.findAll();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(groupRepository, times(1)).findAll();
    }
}
