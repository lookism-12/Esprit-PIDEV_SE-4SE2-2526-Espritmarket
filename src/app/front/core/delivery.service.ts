import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import {
  Delivery,
  DeliveryStatus,
  Complaint,
  CreateComplaintRequest,
  ComplaintStatus,
  Feedback,
  CreateFeedbackRequest,
  ReturnRequest,
  CreateReturnRequest
} from '../models/delivery.model';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private readonly apiUrl = '/api/delivery';

  readonly currentDelivery = signal<Delivery | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  // Delivery Tracking
  getByOrderId(orderId: string): Observable<Delivery> {
    // TODO: Implement HTTP call
    console.log('DeliveryService.getByOrderId() called with:', orderId);
    return of({} as Delivery);
  }

  getByTrackingCode(trackingCode: string): Observable<Delivery> {
    // TODO: Implement HTTP call
    console.log('DeliveryService.getByTrackingCode() called with:', trackingCode);
    return of({} as Delivery);
  }

  getUserDeliveries(): Observable<Delivery[]> {
    // TODO: Implement HTTP call
    console.log('DeliveryService.getUserDeliveries() called');
    return of([]);
  }
}

@Injectable({
  providedIn: 'root'
})
export class SavService {
  private readonly apiUrl = '/api/sav';

  readonly complaints = signal<Complaint[]>([]);
  readonly feedbacks = signal<Feedback[]>([]);
  readonly returns = signal<ReturnRequest[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  // Complaints
  getComplaints(): Observable<Complaint[]> {
    // TODO: Implement HTTP call
    console.log('SavService.getComplaints() called');
    return of([]);
  }

  getComplaintById(id: string): Observable<Complaint> {
    // TODO: Implement HTTP call
    console.log('SavService.getComplaintById() called with:', id);
    return of({} as Complaint);
  }

  createComplaint(request: CreateComplaintRequest): Observable<Complaint> {
    // TODO: Implement HTTP call
    console.log('SavService.createComplaint() called with:', request);
    return of({} as Complaint);
  }

  // Feedback
  getFeedbacks(): Observable<Feedback[]> {
    // TODO: Implement HTTP call
    console.log('SavService.getFeedbacks() called');
    return of([]);
  }

  createFeedback(request: CreateFeedbackRequest): Observable<Feedback> {
    // TODO: Implement HTTP call
    console.log('SavService.createFeedback() called with:', request);
    return of({} as Feedback);
  }

  // Returns
  getReturns(): Observable<ReturnRequest[]> {
    // TODO: Implement HTTP call
    console.log('SavService.getReturns() called');
    return of([]);
  }

  createReturn(request: CreateReturnRequest): Observable<ReturnRequest> {
    // TODO: Implement HTTP call
    console.log('SavService.createReturn() called with:', request);
    return of({} as ReturnRequest);
  }

  uploadReturnImage(returnId: string, file: File): Observable<string> {
    // TODO: Implement HTTP call
    console.log('SavService.uploadReturnImage() called');
    return of('');
  }
}
