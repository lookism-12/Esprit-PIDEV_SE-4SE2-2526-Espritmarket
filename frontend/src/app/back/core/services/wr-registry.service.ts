import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environment';

export interface WrEntry {
  type: 'WARNING' | 'REWARD';
  message: string;
  issuedByAdminId: string;
  issuedAt: string;
}

export interface AgentWrStats {
  agentId: string;
  agentName: string;
  agentEmail: string;
  warningCount: number;
  rewardCount: number;
  flagged: boolean;
  elite: boolean;
  history: WrEntry[];
  lastUpdated: string;
}

@Injectable({ providedIn: 'root' })
export class WrRegistryService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/delivery-agents`;

  getStats(agentId: string): Observable<AgentWrStats> {
    return this.http.get<AgentWrStats>(`${this.base}/${agentId}/wr-stats`).pipe(
      catchError(() => of(this.emptyStats(agentId)))
    );
  }

  getAllStats(): Observable<AgentWrStats[]> {
    return this.http.get<AgentWrStats[]>(`${this.base}/wr-stats/all`).pipe(
      catchError(() => of([]))
    );
  }

  getFlagged(): Observable<AgentWrStats[]> {
    return this.http.get<AgentWrStats[]>(`${this.base}/wr-stats/flagged`).pipe(
      catchError(() => of([]))
    );
  }

  getElite(): Observable<AgentWrStats[]> {
    return this.http.get<AgentWrStats[]>(`${this.base}/wr-stats/elite`).pipe(
      catchError(() => of([]))
    );
  }

  addWarning(agentId: string, agentName: string, agentEmail: string, message: string, issuedByAdminId = 'admin'): Observable<AgentWrStats> {
    return this.http.post<AgentWrStats>(`${this.base}/${agentId}/warning`, {
      agentName, agentEmail, message, issuedByAdminId
    });
  }

  addReward(agentId: string, agentName: string, agentEmail: string, message: string, issuedByAdminId = 'admin'): Observable<AgentWrStats> {
    return this.http.post<AgentWrStats>(`${this.base}/${agentId}/reward`, {
      agentName, agentEmail, message, issuedByAdminId
    });
  }

  rehabilitate(agentId: string): Observable<AgentWrStats> {
    return this.http.post<AgentWrStats>(`${this.base}/${agentId}/rehabilitate`, {});
  }

  private emptyStats(agentId: string): AgentWrStats {
    return { agentId, agentName: '', agentEmail: '', warningCount: 0, rewardCount: 0, flagged: false, elite: false, history: [], lastUpdated: '' };
  }
}
