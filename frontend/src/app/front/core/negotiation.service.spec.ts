import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { NegotiationService } from './negotiation.service';
import {
  Negotiation,
  NegotiationResponse,
  NegotiationStatus,
  ProposalType,
} from '../models/negotiation.model';
import { environment } from '../../../environment';

const BASE = `${environment.apiUrl}/negociations`;

function makeResponse(overrides: Partial<NegotiationResponse> = {}): NegotiationResponse {
  return {
    id: 'neg-001',
    clientId: 'client-001',
    clientFullName: 'Alice Smith',
    productId: 'prod-001',
    productName: 'Wireless Keyboard',
    productOriginalPrice: 85,
    status: NegotiationStatus.IN_PROGRESS,
    proposals: [],
    createdAt: '2026-03-29T10:00:00',
    updatedAt: '2026-03-30T10:00:00',
    ...overrides,
  };
}

describe('NegotiationService', () => {
  let service: NegotiationService;
  let http: HttpTestingController;

  beforeEach(() => {
    if (!getTestBed().platform) {
      getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
    }
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        NegotiationService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(NegotiationService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // ── createNegotiation ───────────────────────────────────────────────────────
  describe('createNegotiation()', () => {
    it('POSTs to /negociations with mapped payload', () => {
      const res = makeResponse();
      service.createNegotiation({ productId: 'prod-001', proposedPrice: 70 }).subscribe();

      const req = http.expectOne(BASE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ serviceId: 'prod-001', amount: 70 });
      req.flush(res);
    });
  });

  // ── getNegotiationById ──────────────────────────────────────────────────────
  describe('getNegotiationById()', () => {
    it('GETs /negociations/:id', () => {
      const res = makeResponse();
      service.getNegotiationById('neg-001').subscribe(r => expect(r.id).toBe('neg-001'));

      const req = http.expectOne(`${BASE}/neg-001`);
      expect(req.request.method).toBe('GET');
      req.flush(res);
    });
  });

  // ── getAll (my negotiations) ────────────────────────────────────────────────
  describe('getAll()', () => {
    it('GETs /negociations/my and wraps in { negotiations }', () => {
      const list: Negotiation[] = [makeResponse() as Negotiation];
      service.getAll().subscribe(r => {
        expect(r.negotiations).toHaveLength(1);
      });

      const req = http.expectOne(`${BASE}/my`);
      expect(req.request.method).toBe('GET');
      req.flush(list);
    });
  });

  // ── getProviderNegotiations ─────────────────────────────────────────────────
  describe('getProviderNegotiations()', () => {
    it('GETs /negociations/all', () => {
      service.getProviderNegotiations().subscribe();

      const req = http.expectOne(`${BASE}/all`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  // ── getIncomingNegociations ─────────────────────────────────────────────────
  describe('getIncomingNegociations()', () => {
    it('GETs /negociations/all and wraps in { negotiations }', () => {
      const list: Negotiation[] = [makeResponse() as Negotiation];
      service.getIncomingNegociations().subscribe(r => {
        expect(r.negotiations).toHaveLength(1);
      });

      const req = http.expectOne(`${BASE}/all`);
      req.flush(list);
    });
  });

  // ── accept ──────────────────────────────────────────────────────────────────
  describe('accept()', () => {
    it('PATCHes /negociations/:id/status/direct with status=ACCEPTED', () => {
      const res = makeResponse({ status: NegotiationStatus.ACCEPTED });
      service.accept('neg-001').subscribe(r => expect(r.status).toBe(NegotiationStatus.ACCEPTED));

      const req = http.expectOne(r => r.url === `${BASE}/neg-001/status/direct`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.params.get('status')).toBe('ACCEPTED');
      req.flush(res);
    });
  });

  // ── reject ──────────────────────────────────────────────────────────────────
  describe('reject()', () => {
    it('PATCHes /negociations/:id/status/direct with status=REJECTED', () => {
      const res = makeResponse({ status: NegotiationStatus.REJECTED });
      service.reject('neg-001').subscribe(r => expect(r.status).toBe(NegotiationStatus.REJECTED));

      const req = http.expectOne(r => r.url === `${BASE}/neg-001/status/direct`);
      expect(req.request.params.get('status')).toBe('REJECTED');
      req.flush(res);
    });
  });

  // ── submitCounterProposal ───────────────────────────────────────────────────
  describe('submitCounterProposal()', () => {
    it('POSTs to /negociations/:id/proposals/direct with amount and type', () => {
      const res = makeResponse({ status: NegotiationStatus.IN_PROGRESS });
      service.submitCounterProposal({ negotiationId: 'neg-001', amount: 75, message: 'Counter' })
        .subscribe();

      const req = http.expectOne(`${BASE}/neg-001/proposals/direct`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        amount: 75,
        message: 'Counter',
        type: 'COUNTER_PROPOSAL',
      });
      req.flush(res);
    });
  });

  // ── updateNegotiation (COUNTER action) ─────────────────────────────────────
  describe('updateNegotiation() — COUNTER action', () => {
    it('POSTs to /proposals/direct when action is COUNTER', () => {
      service.updateNegotiation('neg-001', { action: 'COUNTER', newPrice: 60 }).subscribe();

      const req = http.expectOne(`${BASE}/neg-001/proposals/direct`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.amount).toBe(60);
      expect(req.request.body.type).toBe('COUNTER_PROPOSAL');
      req.flush(makeResponse());
    });
  });

  // ── cancel ──────────────────────────────────────────────────────────────────
  describe('cancel()', () => {
    it('DELETEs /negociations/:id', () => {
      service.cancel('neg-001').subscribe();

      const req = http.expectOne(`${BASE}/neg-001`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  // ── acceptNegotiation / rejectNegotiation / counterOffer (aliases) ──────────
  describe('provider dashboard aliases', () => {
    it('acceptNegotiation delegates to accept()', () => {
      const spy = vi.spyOn(service, 'accept').mockReturnValue(of(makeResponse()));
      service.acceptNegotiation('neg-001').subscribe();
      expect(spy).toHaveBeenCalledWith('neg-001');
    });

    it('rejectNegotiation delegates to reject()', () => {
      const spy = vi.spyOn(service, 'reject').mockReturnValue(of(makeResponse()));
      service.rejectNegotiation('neg-001').subscribe();
      expect(spy).toHaveBeenCalledWith('neg-001');
    });

    it('counterOffer delegates to submitCounterProposal()', () => {
      const spy = vi.spyOn(service, 'submitCounterProposal').mockReturnValue(of(makeResponse()));
      service.counterOffer('neg-001', 55).subscribe();
      expect(spy).toHaveBeenCalledWith({ negotiationId: 'neg-001', amount: 55 });
    });
  });

  // ── getAllAdmin ─────────────────────────────────────────────────────────────
  describe('getAllAdmin()', () => {
    it('GETs /negociations with page and size params', () => {
      service.getAllAdmin(0, 20).subscribe();

      const req = http.expectOne(r =>
        r.url === BASE &&
        r.params.get('page') === '0' &&
        r.params.get('size') === '20'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ content: [] });
    });

    it('returns empty content array when API returns null content', () => {
      service.getAllAdmin().subscribe(r => expect(r.content).toEqual([]));

      const req = http.expectOne(r => r.url === BASE);
      req.flush({});
    });
  });
});
