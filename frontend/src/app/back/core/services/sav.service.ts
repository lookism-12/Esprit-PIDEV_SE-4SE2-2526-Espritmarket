import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Delivery, DeliveryRequest, SavFeedback, SavFeedbackRequest } from '../models/sav.models';

const BASE_URL = 'http://localhost:8090/api';

@Injectable({
    providedIn: 'root'
})
export class SavService {

    constructor(private http: HttpClient) {}

    // ===================== DELIVERY ENDPOINTS =====================

    getAllDeliveries(): Observable<Delivery[]> {
        return this.http.get<Delivery[]>(`${BASE_URL}/deliveries`);
    }

    getDeliveryById(id: string): Observable<Delivery> {
        return this.http.get<Delivery>(`${BASE_URL}/deliveries/${id}`);
    }

    getDeliveriesByUser(userId: string): Observable<Delivery[]> {
        return this.http.get<Delivery[]>(`${BASE_URL}/deliveries/user/${userId}`);
    }

    getDeliveriesByCart(cartId: string): Observable<Delivery[]> {
        return this.http.get<Delivery[]>(`${BASE_URL}/deliveries/cart/${cartId}`);
    }

    getDeliveryAgents(): Observable<any[]> {
        return this.http.get<any[]>(`${BASE_URL}/users/role/DELIVERY`);
    }

    getUserDetails(userId: string): Observable<any> {
        return this.http.get<any>(`${BASE_URL}/users/${userId}`);
    }

    getDeliveryCarts(): Observable<any[]> {
        return this.http.get<any[]>(`${BASE_URL}/cart/all`);
    }

    createDelivery(request: DeliveryRequest): Observable<Delivery> {
        return this.http.post<Delivery>(`${BASE_URL}/deliveries`, request);
    }

    updateDelivery(id: string, request: DeliveryRequest): Observable<Delivery> {
        return this.http.put<Delivery>(`${BASE_URL}/deliveries/${id}`, request);
    }

    updateDeliveryStatus(id: string, status: string): Observable<Delivery> {
        const params = new HttpParams().set('status', status);
        return this.http.patch<Delivery>(`${BASE_URL}/deliveries/${id}/status`, null, { params });
    }

    deleteDelivery(id: string): Observable<void> {
        return this.http.delete<void>(`${BASE_URL}/deliveries/${id}`);
    }

    // ===================== SAV FEEDBACK ENDPOINTS =====================

    getAllFeedbacks(): Observable<SavFeedback[]> {
        return this.http.get<SavFeedback[]>(`${BASE_URL}/sav-feedbacks`);
    }

    getFeedbackById(id: string): Observable<SavFeedback> {
        return this.http.get<SavFeedback>(`${BASE_URL}/sav-feedbacks/${id}`);
    }

    getFeedbacksByCartItem(cartItemId: string): Observable<SavFeedback[]> {
        return this.http.get<SavFeedback[]>(`${BASE_URL}/sav-feedbacks/cart-item/${cartItemId}`);
    }

    getFeedbacksByType(type: string): Observable<SavFeedback[]> {
        return this.http.get<SavFeedback[]>(`${BASE_URL}/sav-feedbacks/type/${type}`);
    }

    createFeedback(request: SavFeedbackRequest): Observable<SavFeedback> {
        return this.http.post<SavFeedback>(`${BASE_URL}/sav-feedbacks`, request);
    }

    updateFeedback(id: string, request: SavFeedbackRequest): Observable<SavFeedback> {
        return this.http.put<SavFeedback>(`${BASE_URL}/sav-feedbacks/${id}`, request);
    }

    updateFeedbackStatus(id: string, status: string): Observable<SavFeedback> {
        const params = new HttpParams().set('status', status);
        return this.http.patch<SavFeedback>(`${BASE_URL}/sav-feedbacks/${id}/status`, null, { params });
    }

    updateFeedbackAdminResponse(id: string, response: string): Observable<SavFeedback> {
        const params = new HttpParams().set('response', response);
        return this.http.patch<SavFeedback>(
            `${BASE_URL}/sav-feedbacks/${id}/admin-response`,
            {},
            { params }
        );
    }

    deleteFeedback(id: string): Observable<void> {
        return this.http.delete<void>(`${BASE_URL}/sav-feedbacks/${id}`);
    }
}
