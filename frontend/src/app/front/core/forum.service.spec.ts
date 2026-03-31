import '../../../setup-vitest';
import { TestBed } from '@angular/core/testing';
import { ForumService } from './forum.service';
import axios from 'axios';
import { of, throwError } from 'rxjs';

declare const vi: any;

// Mock Axios methods
vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => ({
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        interceptors: {
          request: { use: vi.fn() }
        }
      }))
    }
  };
});

describe('ForumService', () => {
  let service: ForumService;
  let mockAxiosInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [ForumService]
    });

    service = TestBed.inject(ForumService);
    // Grab the mocked axios instance
    mockAxiosInstance = (service as any).http;
    
    // Mock local storage for auth checks
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      if (key === 'userId') return 'user-123';
      if (key === 'authToken') return 'test-token';
      return null;
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Loading posts
  it('should fetch posts list', (done) => {
    const mockPosts = [{ id: 'post-1', title: 'Hello', content: 'World' }];
    mockAxiosInstance.get.mockResolvedValue({ data: mockPosts });

    service.getPosts().subscribe((posts) => {
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/forum/posts');
      expect(posts).toEqual(mockPosts as any);
      done();
    });
  });

  // Creating post
  it('should create a post', (done) => {
    const requestPayload = { categoryId: 'cat-1', title: 'Title', content: 'Content', tags: [] };
    const mockResponse = { id: 'post-new', ...requestPayload };
    mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

    service.createPost(requestPayload).subscribe((post) => {
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/forum/posts', {
        userId: 'user-123',
        categoryId: 'cat-1',
        content: 'Title\nContent',
        pinned: false,
        approved: true
      });
      expect(post).toEqual(mockResponse as any);
      done();
    });
  });

  // Updating post
  it('should update a post', (done) => {
    const mockResponse = { id: 'post-1' };
    mockAxiosInstance.put.mockResolvedValue({ data: mockResponse });

    service.updatePost('post-1', {
      categoryId: 'cat-2',
      title: 'Updated Title',
      content: 'Updated Content',
      pinned: true,
      approved: true
    }).subscribe((post) => {
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/forum/posts/post-1', {
        userId: 'user-123',
        categoryId: 'cat-2',
        content: 'Updated Title\nUpdated Content',
        pinned: true,
        approved: true
      });
      expect(post).toEqual(mockResponse as any);
      done();
    });
  });

  // Deleting post
  it('should delete a post', (done) => {
    mockAxiosInstance.delete.mockResolvedValue({});

    service.deletePost('post-1').subscribe(() => {
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/forum/posts/post-1');
      done();
    });
  });

  // Handling errors (Observables)
  it('should handle RxJS error when creating a comment fails', (done) => {
    mockAxiosInstance.post.mockRejectedValue(new Error('API Error'));

    service.createComment({ postId: 'post-1', content: 'C' }).subscribe({
      next: () => done.fail('Should have failed'),
      error: (err) => {
        expect(err.message).toBe('API Error');
        done();
      }
    });
  });
});
