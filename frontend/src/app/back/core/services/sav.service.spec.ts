import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { SavService } from './sav.service';
import { DeliveryRequest, SavFeedbackRequest } from '../models/sav.models';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('SavService', () => {
    let service: SavService;
    let httpMock: HttpTestingController;

    const BASE_URL = 'http://localhost:8090/api';

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                { provide: SavService, useFactory: (http: HttpClient) => new SavService(http), deps: [HttpClient] }
            ]
        });

        service = TestBed.inject(SavService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify(); // Ensure no outstanding requests
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    // ===================== DELIVERY TESTS =====================

    it('should fetch all deliveries via GET', () => {
        const mockDeliveries = [{ id: '1', status: 'PREPARING' }, { id: '2', status: 'DELIVERED' }];

        service.getAllDeliveries().subscribe(deliveries => {
            expect(deliveries.length).toBe(2);
            expect(deliveries).toEqual(mockDeliveries as any);
        });

        const req = httpMock.expectOne(`${BASE_URL}/deliveries`);
        expect(req.request.method).toBe('GET');
        req.flush(mockDeliveries);
    });

    it('should create a delivery via POST', () => {
        const newDelivery: DeliveryRequest = {
            address: '123 Test Street',
            deliveryDate: '2025-12-31T10:00:00',
            status: 'PREPARING',
            userId: 'user123',
            cartId: 'cart123'
        };

        const mockResponse = { id: 'del-1', ...newDelivery };

        service.createDelivery(newDelivery).subscribe(delivery => {
            expect(delivery).toBeTruthy();
            expect(delivery.id).toBe('del-1');
            expect(delivery.address).toBe('123 Test Street');
        });

        const req = httpMock.expectOne(`${BASE_URL}/deliveries`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(newDelivery);
        req.flush(mockResponse);
    });

    it('should update delivery status via PATCH with query params', () => {
        const deliveryId = 'del-1';
        const newStatus = 'DELIVERED';
        const mockResponse = { id: deliveryId, status: newStatus };

        service.updateDeliveryStatus(deliveryId, newStatus).subscribe(delivery => {
            expect(delivery.status).toBe(newStatus);
        });

        // Test the exact URL and params
        const req = httpMock.expectOne(request => 
            request.url === `${BASE_URL}/deliveries/${deliveryId}/status` &&
            request.params.get('status') === newStatus
        );
        expect(req.request.method).toBe('PATCH');
        req.flush(mockResponse);
    });

    // ===================== FEEDBACK TESTS =====================

    it('should fetch all feedbacks via GET', () => {
        const mockFeedbacks = [{ id: 'f-1', content: 'Great!' }];

        service.getAllFeedbacks().subscribe(feedbacks => {
            expect(feedbacks.length).toBe(1);
            expect(feedbacks).toEqual(mockFeedbacks as any);
        });

        const req = httpMock.expectOne(`${BASE_URL}/sav-feedbacks`);
        expect(req.request.method).toBe('GET');
        req.flush(mockFeedbacks);
    });

    it('should create a feedback via POST', () => {
        const newFeedback: SavFeedbackRequest = {
            type: 'SAV',
            message: 'Item broken',
            rating: 1,
            reason: 'BROKEN',
            status: 'PENDING',
            cartItemId: 'item-1'
        };

        service.createFeedback(newFeedback).subscribe(res => {
            expect(res).toBeTruthy();
        });

        const req = httpMock.expectOne(`${BASE_URL}/sav-feedbacks`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(newFeedback);
        req.flush({ id: 'f-2', ...newFeedback });
    });

    it('should update feedback admin response via PATCH with query params', () => {
        const feedbackId = 'f-1';
        const adminResp = 'Sorry for the issue';

        service.updateFeedbackAdminResponse(feedbackId, adminResp).subscribe(res => {
            expect(res.adminResponse).toBe(adminResp);
        });

        const req = httpMock.expectOne(request => 
            request.url === `${BASE_URL}/sav-feedbacks/${feedbackId}/admin-response` &&
            request.params.get('response') === adminResp
        );
        expect(req.request.method).toBe('PATCH');
        req.flush({ id: feedbackId, adminResponse: adminResp });
    });
});
