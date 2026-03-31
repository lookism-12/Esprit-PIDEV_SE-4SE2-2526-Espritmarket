import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { Negotiations } from './negotiations';
import { NegotiationService } from '../../core/negotiation.service';
import { NegotiationStatus, NegotiationResponse } from '../../models/negotiation.model';

describe('Negotiations component', () => {
  let component: Negotiations;
  let fixture: ComponentFixture<Negotiations>;

  // ── Mock data ─────────────────────────────────────────────────────────────
  const mockCreated: NegotiationResponse = {
    id: 'n-1',
    productName: 'Laptop',
    status: NegotiationStatus.PENDING,
    clientName: 'Alice',
    sellerName: 'Bob',
    proposals: [],
    createdAt: '2026-03-01T10:00:00Z'
  };

  const mockUpdated: NegotiationResponse = {
    ...mockCreated,
    status: NegotiationStatus.ACCEPTED
  };

  // ── Service spy ───────────────────────────────────────────────────────────
  const serviceSpy = {
    createNegotiation: vi.fn().mockReturnValue(of(mockCreated)),
    getNegotiationById: vi.fn().mockReturnValue(of(mockCreated)),
    updateNegotiation: vi.fn().mockReturnValue(of(mockUpdated)),
    closeNegotiation: vi.fn().mockReturnValue(of(void 0))
  };

  beforeEach(async () => {
    // Reset spies before each test
    Object.values(serviceSpy).forEach(spy => spy.calls.reset());
    serviceSpy.createNegotiation.and.returnValue(of(mockCreated));
    serviceSpy.getNegotiationById.and.returnValue(of(mockCreated));
    serviceSpy.updateNegotiation.and.returnValue(of(mockUpdated));
    serviceSpy.closeNegotiation.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [Negotiations, ReactiveFormsModule],
      providers: [{ provide: NegotiationService, useValue: serviceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(Negotiations);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Component creation ────────────────────────────────────────────────────

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty negotiations list', () => {
    expect(component.negotiations()).toEqual([]);
  });

  it('should not be loading after ngOnInit', () => {
    expect(component.isLoading()).toBe(false);
  });

  it('should have no error initially', () => {
    expect(component.error()).toBeNull();
  });

  // ── createNegotiation ─────────────────────────────────────────────────────

  it('should not call service when form is invalid', () => {
    component.createNegotiation();
    expect(serviceSpy.createNegotiation).not.toHaveBeenCalled();
  });

  it('should create negotiation when form is valid', () => {
    component.createForm.patchValue({ productId: 'prod-1', proposedPrice: 100 });
    component.createNegotiation();

    expect(serviceSpy.createNegotiation).toHaveBeenCalled();
    expect(component.negotiations().length).toBe(1);
    expect(component.negotiations()[0].id).toBe('n-1');
    expect(component.selectedId()).toBe('n-1');
    expect(component.selected()).toEqual(mockCreated);
  });

  it('should prepend new negotiation to the list', () => {
    // Set initial state with an existing negotiation
    component.negotiations.set([{ ...mockCreated, id: 'old-1' }]);

    component.createForm.patchValue({ productId: 'prod-2', proposedPrice: 200 });
    component.createNegotiation();

    expect(component.negotiations().length).toBe(2);
    expect(component.negotiations()[0].id).toBe('n-1'); // newest first
  });

  it('should reset form after successful creation', () => {
    component.createForm.patchValue({ productId: 'prod-1', proposedPrice: 100 });
    component.createNegotiation();

    expect(component.createForm.value.productId).toBe('');
    expect(component.createForm.value.proposedPrice).toBe(0);
  });

  it('should set error on creation failure', () => {
    serviceSpy.createNegotiation.and.returnValue(
      throwError(() => ({ error: { message: 'Duplicate negotiation' } }))
    );

    component.createForm.patchValue({ productId: 'prod-1', proposedPrice: 100 });
    component.createNegotiation();

    expect(component.error()).toBe('Duplicate negotiation');
  });

  it('should set fallback error message when server error has no message', () => {
    serviceSpy.createNegotiation.and.returnValue(throwError(() => ({})));

    component.createForm.patchValue({ productId: 'prod-1', proposedPrice: 100 });
    component.createNegotiation();

    expect(component.error()).toBe('Failed to create negotiation');
  });

  // ── loadNegotiationDetails / loadById ─────────────────────────────────────

  it('should load negotiation details by id', () => {
    component.loadById('n-1');

    expect(component.selectedId()).toBe('n-1');
    expect(serviceSpy.getNegotiationById).toHaveBeenCalledWith('n-1');
    expect(component.selected()!.id).toBe('n-1');
    expect(component.isLoading()).toBe(false);
  });

  it('should not load if selectedId is null', () => {
    component.selectedId.set(null);
    component.loadNegotiationDetails();

    expect(serviceSpy.getNegotiationById).not.toHaveBeenCalled();
  });

  it('should set error when loading details fails', () => {
    serviceSpy.getNegotiationById.and.returnValue(throwError(() => new Error('Not found')));

    component.loadById('bad-id');

    expect(component.error()).toBe('Failed to load negotiation details.');
    expect(component.isLoading()).toBe(false);
  });

  // ── applyAction ───────────────────────────────────────────────────────────

  it('should accept negotiation', () => {
    component.selected.set(mockCreated);
    component.applyAction('ACCEPT');

    expect(serviceSpy.updateNegotiation).toHaveBeenCalledWith('n-1', { action: 'ACCEPT' });
    expect(component.selected()!.status).toBe(NegotiationStatus.ACCEPTED);
  });

  it('should reject negotiation', () => {
    serviceSpy.updateNegotiation.and.returnValue(
      of({ ...mockCreated, status: NegotiationStatus.REJECTED })
    );
    component.selected.set(mockCreated);
    component.applyAction('REJECT');

    expect(serviceSpy.updateNegotiation).toHaveBeenCalledWith('n-1', { action: 'REJECT' });
  });

  it('should counter with newPrice', () => {
    component.selected.set(mockCreated);
    component.actionForm.patchValue({ newPrice: 150 });
    component.applyAction('COUNTER');

    expect(serviceSpy.updateNegotiation).toHaveBeenCalledWith('n-1', { action: 'COUNTER', newPrice: 150 });
  });

  it('should update negotiations list after action', () => {
    component.negotiations.set([mockCreated]);
    component.selected.set(mockCreated);
    component.applyAction('ACCEPT');

    expect(component.negotiations()[0].status).toBe(NegotiationStatus.ACCEPTED);
  });

  it('should do nothing when no negotiation is selected', () => {
    component.selected.set(null);
    component.applyAction('ACCEPT');

    expect(serviceSpy.updateNegotiation).not.toHaveBeenCalled();
  });

  it('should set error when action fails', () => {
    serviceSpy.updateNegotiation.and.returnValue(throwError(() => ({})));
    component.selected.set(mockCreated);
    component.applyAction('ACCEPT');

    expect(component.error()).toBe('Negotiation update failed');
  });

  // ── closeNegotiation ──────────────────────────────────────────────────────

  it('should close negotiation and set status to CLOSED', () => {
    component.selected.set(mockCreated);
    component.closeNegotiation();

    expect(serviceSpy.closeNegotiation).toHaveBeenCalledWith('n-1');
    expect(component.selected()!.status).toBe(NegotiationStatus.CLOSED);
  });

  it('should do nothing when no negotiation selected', () => {
    component.selected.set(null);
    component.closeNegotiation();

    expect(serviceSpy.closeNegotiation).not.toHaveBeenCalled();
  });

  it('should set error when closing fails', () => {
    serviceSpy.closeNegotiation.and.returnValue(
      throwError(() => ({ error: { message: 'Cannot close' } }))
    );
    component.selected.set(mockCreated);
    component.closeNegotiation();

    expect(component.error()).toBe('Cannot close');
  });

  // ── getStatusClass ────────────────────────────────────────────────────────

  it('should return correct CSS class for PENDING', () => {
    expect(component.getStatusClass('PENDING')).toBe('status-pending');
  });

  it('should return correct CSS class for ACCEPTED', () => {
    expect(component.getStatusClass('ACCEPTED')).toBe('status-accepted');
  });

  it('should return correct CSS class for REJECTED', () => {
    expect(component.getStatusClass('REJECTED')).toBe('status-rejected');
  });

  it('should return correct CSS class for CLOSED', () => {
    expect(component.getStatusClass('CLOSED')).toBe('status-cancelled');
  });

  it('should return default class for unknown status', () => {
    expect(component.getStatusClass('UNKNOWN')).toBe('status-default');
  });
});

