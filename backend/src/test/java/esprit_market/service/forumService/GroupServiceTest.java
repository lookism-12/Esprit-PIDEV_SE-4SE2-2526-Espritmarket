package esprit_market.service.forumService;

import esprit_market.dto.forum.GroupRequest;
import esprit_market.entity.forum.Group;
import esprit_market.mappers.ForumMapper;
import esprit_market.repository.forumRepository.GroupRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GroupServiceTest {

    @Mock
    private GroupRepository repository;

    @InjectMocks
    private GroupService groupService;

    @Test
    void findAll_ShouldReturnList() {
        Group g1 = new Group();
        Group g2 = new Group();
        when(repository.findAll()).thenReturn(Arrays.asList(g1, g2));

        List<Group> result = groupService.findAll();

        assertNotNull(result);
        assertEquals(2, result.size());
        verify(repository, times(1)).findAll();
    }

    @Test
    void findById_WhenIdExists_ShouldReturnGroup() {
        ObjectId id = new ObjectId();
        Group group = new Group();
        when(repository.findById(id)).thenReturn(Optional.of(group));

        Group result = groupService.findById(id);

        assertNotNull(result);
        verify(repository, times(1)).findById(id);
    }

    @Test
    void findById_WhenIdDoesNotExist_ShouldReturnNull() {
        ObjectId id = new ObjectId();
        when(repository.findById(id)).thenReturn(Optional.empty());

        Group result = groupService.findById(id);

        assertNull(result);
    }

    @Test
    void create_WhenDtoIsNull_ShouldReturnNull() {
        Group result = groupService.create(null);
        assertNull(result);
        verify(repository, never()).save(any());
    }

    @Test
    void create_WithLessThanTwoMembers_ShouldThrowIllegalArgumentException() {
        GroupRequest dto = new GroupRequest();
        dto.setMemberIds(Arrays.asList("id1")); // 1 member
        
        try (MockedStatic<ForumMapper> mockedMapper = mockStatic(ForumMapper.class)) {
            mockedMapper.when(() -> ForumMapper.toObjectIdList(anyList()))
                        .thenReturn(Arrays.asList(new ObjectId()));

            IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
                groupService.create(dto);
            });

            assertTrue(exception.getMessage().contains("Un groupe doit avoir au minimum 2"));
            verify(repository, never()).save(any());
        }
    }

    @Test
    void create_WithTwoOrMoreMembers_ShouldSaveAndReturnGroup() {
        GroupRequest dto = new GroupRequest();
        dto.setMemberIds(Arrays.asList("id1", "id2"));
        Group entity = new Group();
        
        try (MockedStatic<ForumMapper> mockedMapper = mockStatic(ForumMapper.class)) {
            mockedMapper.when(() -> ForumMapper.toObjectIdList(anyList()))
                        .thenReturn(Arrays.asList(new ObjectId(), new ObjectId()));
            mockedMapper.when(() -> ForumMapper.toGroup(dto)).thenReturn(entity);
            when(repository.save(entity)).thenReturn(entity);

            Group result = groupService.create(dto);

            assertNotNull(result);
            verify(repository, times(1)).save(entity);
        }
    }

    @Test
    void update_WhenGroupDoesNotExist_ShouldReturnNull() {
        ObjectId id = new ObjectId();
        GroupRequest dto = new GroupRequest();
        when(repository.findById(id)).thenReturn(Optional.empty());

        Group result = groupService.update(id, dto);

        assertNull(result);
        verify(repository, never()).save(any());
    }

    @Test
    void update_WhenGroupExists_ShouldUpdateFieldsAndSave() {
        ObjectId id = new ObjectId();
        GroupRequest dto = new GroupRequest();
        dto.setName("New Name");
        dto.setTopic("New Topic");
        dto.setMemberIds(Arrays.asList("id1", "id2"));
        
        Group existing = new Group();
        
        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(existing)).thenReturn(existing);

        try (MockedStatic<ForumMapper> mockedMapper = mockStatic(ForumMapper.class)) {
            mockedMapper.when(() -> ForumMapper.toObjectIdList(anyList()))
                        .thenReturn(Arrays.asList(new ObjectId(), new ObjectId()));

            Group result = groupService.update(id, dto);

            assertNotNull(result);
            verify(repository, times(1)).save(existing);
        }
    }

    @Test
    void deleteById_ShouldCallRepositoryDelete() {
        ObjectId id = new ObjectId();
        groupService.deleteById(id);
        verify(repository, times(1)).deleteById(id);
    }
}
