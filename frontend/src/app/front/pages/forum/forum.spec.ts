import '../../../../setup-vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Forum } from './forum';
import { ForumService } from '../../core/forum.service';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';

// Using vitest's vi
declare const vi: any;

describe('Forum Component', () => {
  let component: Forum;
  let fixture: ComponentFixture<Forum>;
  let forumServiceMock: any;

  beforeEach(async () => {
    // Mocking HTTP services & observables
    forumServiceMock = {
      isLoading: signal(false),
      getCategories: vi.fn().mockReturnValue(of([])),
      getPosts: vi.fn().mockReturnValue(of([])),
      getComments: vi.fn().mockReturnValue(of([])),
      getReactions: vi.fn().mockReturnValue(of([])),
      getReplies: vi.fn().mockReturnValue(of([])),
      getUserById: vi.fn().mockReturnValue(of({ firstName: 'Test', lastName: 'User' })),
      createPost: vi.fn().mockReturnValue(of({})),
      updatePost: vi.fn().mockReturnValue(of({})),
      deletePost: vi.fn().mockReturnValue(of({})),
      createComment: vi.fn().mockReturnValue(of({})),
      updateComment: vi.fn().mockReturnValue(of({})),
      deleteComment: vi.fn().mockReturnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [Forum, ReactiveFormsModule],
      providers: [
        { provide: ForumService, useValue: forumServiceMock },
        { provide: ActivatedRoute, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Forum);
    component = fixture.componentInstance;
    // Mock local storage for auth checks
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      if (key === 'userRole') return 'ADMIN';
      if (key === 'userId') return 'user-123';
      return null;
    });

    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Component creation
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // Loading posts list
  it('should load forum data on init', () => {
    expect(forumServiceMock.getCategories).toHaveBeenCalled();
    expect(forumServiceMock.getPosts).toHaveBeenCalled();
    expect(forumServiceMock.getComments).toHaveBeenCalled();
    expect(forumServiceMock.getReactions).toHaveBeenCalled();
  });

  // Creating post
  it('should create a post when form is valid', () => {
    component.createPostForm.setValue({
      categoryId: 'cat-1',
      title: 'Valid Title',
      content: 'Valid content that is long enough.',
      tags: 'tag1'
    });

    component.createPost();

    expect(forumServiceMock.createPost).toHaveBeenCalledWith({
      categoryId: 'cat-1',
      title: 'Valid Title',
      content: 'Valid content that is long enough.',
      tags: ['tag1']
    });
    
    // UI update after action
    expect(component.isCreatingPost()).toBe(false);
  });

  it('should not create a post if form is invalid', () => {
    component.createPostForm.setValue({
      categoryId: '',
      title: '',
      content: '',
      tags: ''
    });

    component.createPost();

    expect(forumServiceMock.createPost).not.toHaveBeenCalled();
  });

  // Updating post
  it('should update a post', () => {
    const postMock: any = { id: 'post-1', categoryId: 'cat-1', title: 'Title', content: 'Content' };
    component.openUpdatePostModal(postMock);
    
    component.updatePostForm.setValue({
      categoryId: 'cat-1',
      title: 'Updated Title',
      content: 'Updated Content that is long enough.',
      pinned: true,
      approved: true
    });

    component.submitUpdatePost();

    expect(forumServiceMock.updatePost).toHaveBeenCalledWith('post-1', {
      categoryId: 'cat-1',
      title: 'Updated Title',
      content: 'Updated Content that is long enough.',
      pinned: true,
      approved: true
    });
  });

  // Deleting post
  it('should delete a post if confirmed', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const postMock: any = { id: 'post-1', authorId: 'user-123' };
    
    component.deletePost(postMock);

    expect(forumServiceMock.deletePost).toHaveBeenCalledWith('post-1');
  });

  it('should discard delete post if not confirmed', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const postMock: any = { id: 'post-1', authorId: 'user-123' };
    
    component.deletePost(postMock);

    expect(forumServiceMock.deletePost).not.toHaveBeenCalled();
  });

  // Adding comments
  it('should submit a comment when form is valid', () => {
    component.commentForm.setValue({
      content: 'New comment'
    });

    component.submitComment('post-1');

    expect(forumServiceMock.createComment).toHaveBeenCalledWith({
      postId: 'post-1',
      content: 'New comment'
    });
  });

  it('should fail adding comments if API throws error', () => {
    forumServiceMock.createComment.mockReturnValue(throwError(() => new Error('API Error')));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    component.commentForm.setValue({
      content: 'New comment'
    });

    component.submitComment('post-1');

    expect(consoleSpy).toHaveBeenCalled();
  });

  // UI Updates after action
  it('should toggle post expansion and load comments', () => {
    expect(component.expandedPostId()).toBeNull();
    
    component.togglePostExpansion('post-1');
    
    expect(component.expandedPostId()).toBe('post-1');
    expect(forumServiceMock.getComments).toHaveBeenCalledWith('post-1');
    expect(forumServiceMock.getReplies).toHaveBeenCalled();
  });
});
