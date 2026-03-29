import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

if (!getTestBed().platform) {
  getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
}
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { UserRole } from '../models/user.model';
import { environment } from '../../../environment';

describe('UserService - Advanced Tests', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/users`;

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

  describe('uploadAvatar', () => {
    it('should validate file is an image', () => {
      const nonImageFile = new File([''], 'test.txt', { type: 'text/plain' });
      expect(() => service.uploadAvatar(nonImageFile)).toThrow('File must be an image (JPG, PNG, etc.)');
    });

    it('should validate file size < 5MB', () => {
      // Create a 6MB mock file
      const largeFile = {
        name: 'large.png',
        type: 'image/png',
        size: 6 * 1024 * 1024
      } as File;
      
      expect(() => service.uploadAvatar(largeFile)).toThrow('File size must be less than 5MB');
    });

    it('should upload valid image file', () => {
      const validFile = new File([''], 'avatar.png', { type: 'image/png' });
      const mockResponse = { url: 'http://example.com/avatar.png' };

      service.uploadAvatar(validFile).subscribe(res => {
        expect(res.url).toBe(mockResponse.url);
      });

      const req = httpMock.expectOne(`${apiUrl}/me/avatar`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush(mockResponse);
    });
  });

  describe('getAllUsers - Advanced Filtering', () => {
    it('should handle all filter types correctly in URL params', () => {
      service.getAllUsers({
        role: UserRole.DRIVER,
        search: 'john',
        isVerified: true,
        page: 5,
        limit: 20
      }).subscribe();

      const req = httpMock.expectOne((r: any) => {
        return r.url === apiUrl &&
               r.params.get('role') === UserRole.DRIVER &&
               r.params.get('search') === 'john' &&
               r.params.get('isVerified') === 'true' &&
               r.params.get('page') === '5' &&
               r.params.get('limit') === '20';
      });
      req.flush({ users: [], total: 0 });
    });
  });

  describe('verifyEmail', () => {
    it('should call verification endpoint with token', () => {
      const token = 'verify-123';
      service.verifyEmail(token).subscribe(res => {
        expect(res.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/me/verify`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ token });
      req.flush({ success: true, message: 'Verified' });
    });
  });

  describe('requestVerificationEmail', () => {
    it('should call verify-request endpoint', () => {
      service.requestVerificationEmail().subscribe();
      const req = httpMock.expectOne(`${apiUrl}/me/verify-request`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, message: 'Email sent' });
    });
  });
});
