import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

if (!getTestBed().platform) {
  getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
}
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { UserService, UpdateProfileRequest, UserListResponse } from './user.service';
import { User, UserRole } from '../models/user.model';
import { environment } from '../../../environment';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/users`;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.CLIENT,
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        UserService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    if (httpMock) {
      httpMock.verify();
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProfile', () => {
    it('should fetch current user profile', () => {
      service.getProfile().subscribe(user => {
        expect(user).toEqual(mockUser);
        expect(service.isLoading()).toBe(false);
      });

      const req = httpMock.expectOne(`${apiUrl}/me`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });

    it('should set isLoading to true when fetching profile', () => {
      service.getProfile().subscribe();
      expect(service.isLoading()).toBe(true);
      
      const req = httpMock.expectOne(`${apiUrl}/me`);
      req.flush(mockUser);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile via PATCH', () => {
      const updateData: UpdateProfileRequest = { firstName: 'Jane' };
      const updatedUser = { ...mockUser, firstName: 'Jane' };

      service.updateProfile(updateData).subscribe(user => {
        expect(user.firstName).toBe('Jane');
        expect(service.isLoading()).toBe(false);
      });

      const req = httpMock.expectOne(`${apiUrl}/me`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updateData);
      req.flush(updatedUser);
    });

    it('should handle update errors', () => {
      const updateData: UpdateProfileRequest = { firstName: 'Jane' };

      service.updateProfile(updateData).subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
          expect(service.isLoading()).toBe(false);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/me`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('changePassword', () => {
    it('should call password change endpoint', () => {
      const response = { success: true, message: 'Password changed' };
      
      service.changePassword('oldPass', 'newPass').subscribe(res => {
        expect(res.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/me/password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        currentPassword: 'oldPass',
        newPassword: 'newPass'
      });
      req.flush(response);
    });
  });

  describe('deleteAccount', () => {
    it('should delete current user account when no ID provided', () => {
      service.deleteAccount().subscribe();

      const req = httpMock.expectOne(`${apiUrl}/me`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should delete specified user account when ID provided', () => {
      service.deleteAccount('user-456').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/user-456`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('getAllUsers', () => {
    it('should fetch users with filter parameters', () => {
      const mockResponse: UserListResponse = {
        users: [mockUser],
        total: 1,
        page: 1,
        totalPages: 1
      };

      service.getAllUsers({ role: UserRole.ADMIN, page: 2 }).subscribe(res => {
        expect(res.users.length).toBe(1);
      });

      const req = httpMock.expectOne(req => 
        req.url === apiUrl && 
        req.params.get('role') === UserRole.ADMIN &&
        req.params.get('page') === '2'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
