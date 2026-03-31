import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal, computed } from '@angular/core';
import { of, throwError } from 'rxjs';
import { NegotiationService } from '../../../front/core/negotiation.service';
import { Negotiation, NegotiationStatus } from '../../../front/models/negotiation.model';

function makeNeg(o = {}) {
  return {
    id: 'neg-001', clientId: 'c1', clientFullName: 'Alice Smith',
    productId: 'p1', productName: 'Wireless Keyboard', productOriginalPrice: 85,
    status: NegotiationStatus.IN_PROGRESS,
    proposals: [{ senderId: 'c1', senderFullName: 'Alice', amount: 70, createdAt: '2026-03-30T10:00:00' }],
    createdAt: '2026-03-29T10:00:00', updatedAt: '2026-03-30T10:00:00', ...o,
  };
}

function createHarness(svc) {
  const all = signal([]);
  const isLoading = signal(true);
  const error = signal(null);
  const searchQuery = signal('');
  const filterStatus = signal('ALL');
  const negotiations = computed(() => {
    let list = all();
    const q = searchQuery().toLowerCase().trim();
    const s = filterStatus();
    if (s !== 'ALL') list = list.filter(n => n.status === s);
    if (q) list = list.filter(n =>
      (n.productName || n.serviceName || '').toLowerCase().includes(q) ||
      (n.clientFullName || '').toLowerCase().includes(q) ||
      n.id.toLowerCase().includes(q));
    return list;
  });
  const stats = computed(() => {
    const a = all();
    return {
      total: a.length,
      pending: a.filter(n => n.status === 'PENDING').length,
      inProgress: a.filter(n => n.status === 'IN_PROGRESS').length,
      accepted: a.filter(n => n.status === 'ACCEPTED').length,
      rejected: a.filter(n => n.status === 'REJECTED').length,
    };
  });
  function load() {
    isLoading.set(true); error.set(null);
    svc.getProviderNegotiations().subscribe({
      next: (list) => {
        all.set((list || []).map(n => ({ ...n, currentOffer: n.proposals?.length ? n.proposals[n.proposals.length - 1].amount : null })));
        isLoading.set(false);
      },
      error: () => { error.set('Failed to load negotiations.'); isLoading.set(false); },
    });
  }
  function getStatusClass(s) {
    return ({ PENDING: 'status-pending', IN_PROGRESS: 'status-inprogress', ACCEPTED: 'status-accepted', REJECTED: 'status-rejected', CANCELLED: 'status-cancelled' })[s] || 'status-default';
  }
  load();
  return { allNegotiations: all, isLoading, error, searchQuery, filterStatus, negotiations, stats, load, getStatusClass };
}

describe('NegotiationsComponent (Admin)', () => {
  let svc;
  let h;

  beforeEach(() => {
    svc = { getProviderNegotiations: vi.fn().mockReturnValue(of([])) };
    h = createHarness(svc);
  });

  describe('ngOnInit', () => {
    it('calls getProviderNegotiations on init', () => expect(svc.getProviderNegotiations).toHaveBeenCalledOnce());
    it('sets isLoading to false after load', () => expect(h.isLoading()).toBe(false));
    it('starts with empty list', () => expect(h.allNegotiations()).toHaveLength(0));
  });

  describe('load()', () => {
    it('populates from API', () => {
      vi.mocked(svc.getProviderNegotiations).mockReturnValue(of([makeNeg(), makeNeg({ id: 'n2', status: NegotiationStatus.ACCEPTED })]));
      h.load();
      expect(h.allNegotiations()).toHaveLength(2);
    });
    it('sets error on failure', () => {
      vi.mocked(svc.getProviderNegotiations).mockReturnValue(throwError(() => new Error('fail')));
      h.load();
      expect(h.error()).toBe('Failed to load negotiations.');
    });
    it('clears error before load', () => {
      h.error.set('old'); vi.mocked(svc.getProviderNegotiations).mockReturnValue(of([]));
      h.load();
      expect(h.error()).toBeNull();
    });
    it('maps currentOffer from last proposal', () => {
      vi.mocked(svc.getProviderNegotiations).mockReturnValue(of([makeNeg({ proposals: [
        { senderId: 'c1', senderFullName: 'Alice', amount: 60, createdAt: '2026-03-29T10:00:00' },
        { senderId: 'c1', senderFullName: 'Alice', amount: 75, createdAt: '2026-03-30T10:00:00' },
      ]})]));
      h.load();
      expect(h.allNegotiations()[0].currentOffer).toBe(75);
    });
  });

  describe('stats()', () => {
    beforeEach(() => {
      vi.mocked(svc.getProviderNegotiations).mockReturnValue(of([
        makeNeg({ status: NegotiationStatus.PENDING }),
        makeNeg({ id: 'n2', status: NegotiationStatus.IN_PROGRESS }),
        makeNeg({ id: 'n3', status: NegotiationStatus.IN_PROGRESS }),
        makeNeg({ id: 'n4', status: NegotiationStatus.ACCEPTED }),
        makeNeg({ id: 'n5', status: NegotiationStatus.REJECTED }),
      ]));
      h.load();
    });
    it('total=5',      () => expect(h.stats().total).toBe(5));
    it('pending=1',    () => expect(h.stats().pending).toBe(1));
    it('inProgress=2', () => expect(h.stats().inProgress).toBe(2));
    it('accepted=1',   () => expect(h.stats().accepted).toBe(1));
    it('rejected=1',   () => expect(h.stats().rejected).toBe(1));
  });

  describe('negotiations() filtering', () => {
    beforeEach(() => {
      vi.mocked(svc.getProviderNegotiations).mockReturnValue(of([
        makeNeg({ id: 'n1', status: NegotiationStatus.PENDING, clientFullName: 'Alice Smith' }),
        makeNeg({ id: 'n2', status: NegotiationStatus.ACCEPTED, clientFullName: 'Bob Jones', productName: 'Gaming Mouse' }),
        makeNeg({ id: 'n3', status: NegotiationStatus.REJECTED, clientFullName: 'Carol White' }),
      ]));
      h.load();
    });
    it('ALL returns 3',          () => { h.filterStatus.set('ALL');      expect(h.negotiations()).toHaveLength(3); });
    it('PENDING returns 1',      () => { h.filterStatus.set('PENDING');  expect(h.negotiations()).toHaveLength(1); });
    it('ACCEPTED returns 1',     () => { h.filterStatus.set('ACCEPTED'); expect(h.negotiations()).toHaveLength(1); });
    it('search by client name',  () => { h.searchQuery.set('bob');       expect(h.negotiations()[0].clientFullName).toBe('Bob Jones'); });
    it('search by product name', () => { h.searchQuery.set('gaming');    expect(h.negotiations()[0].productName).toBe('Gaming Mouse'); });
    it('no match returns empty', () => { h.searchQuery.set('zzz');       expect(h.negotiations()).toHaveLength(0); });
    it('status + search combo',  () => { h.filterStatus.set('ACCEPTED'); h.searchQuery.set('bob'); expect(h.negotiations()).toHaveLength(1); });
  });

  describe('getStatusClass()', () => {
    it.each([
      ['PENDING',     'status-pending'],
      ['IN_PROGRESS', 'status-inprogress'],
      ['ACCEPTED',    'status-accepted'],
      ['REJECTED',    'status-rejected'],
      ['CANCELLED',   'status-cancelled'],
      ['UNKNOWN',     'status-default'],
    ])('%s to %s', (s, e) => expect(h.getStatusClass(s)).toBe(e));
  });
});
