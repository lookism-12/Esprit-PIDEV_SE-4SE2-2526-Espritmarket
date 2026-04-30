export type DeliveryRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface DeliveryEtaPrediction {
  id: string;
  deliveryId: string;
  orderId?: string;
  orderNumber?: string;
  estimatedMinutes: number;
  riskLevel: DeliveryRiskLevel;
  reason: string;
  weather: string;
  temperatureC?: number;
  windSpeed?: number;
  distanceKm?: number;
  routeDurationMinutes?: number;
  originLatitude?: number;
  originLongitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
  modelVersion?: string;
  source?: string;
  createdAt: string;
}
