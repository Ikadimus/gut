
import { createClient } from '@supabase/supabase-js';
import { GUTIssue, Status, ThermographyRecord, SystemSettings, User, UserRole, Equipment } from '../types';

const supabaseUrl = 'https://ffzwavnqpeuqqidotsyp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmendhdm5xcGV1cXFpZG90c3lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NDA4NjMsImV4cCI6MjA3NzIxNjg2M30.r5-ONF9TldNq0mstFh47jwdklEyx6v8dWErRPRQ5__Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const getErrorMessage = (error: any): string => {
  if (!error) return "Erro desconhecido";
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  return JSON.stringify(error);
};

export const storageService = {
  async checkBucketExists(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.getBucket('attachments');
      if (error) return false;
      return !!data;
    } catch {
      return false;
    }
  },

  async uploadFile(file: File, folder: 'gut' | 'thermography' | 'assets' = 'gut'): Promise<{ url: string; name: string }> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;
    
    const { error } = await supabase.storage.from('attachments').upload(filePath, file);
    
    if (error) {
      const msg = getErrorMessage(error);
      if (msg.includes("bucket_not_found") || msg.toLowerCase().includes("bucket not found")) {
        throw new Error("INFRA_ERROR: O bucket 'attachments' não existe no Supabase.");
      }
      throw new Error(msg);
    }

    const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(filePath);
    return { url: publicUrl, name: file.name };
  }
};

export const userService = {
  async login(email: string, password: string): Promise<User | null> {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).eq('password', password).maybeSingle();
    if (error) throw new Error(getErrorMessage(error));
    if (!data) return null;
    return { id: String(data.id), name: data.name, email: data.email, role: data.role as UserRole, createdAt: data.created_at };
  },
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*').order('name');
    if (error) throw new Error(getErrorMessage(error));
    // Fixed: access individual record's created_at (d.created_at) inside the map function.
    return (data || []).map(d => ({ id: String(d.id), name: d.name, email: d.email, role: d.role as UserRole, createdAt: d.created_at }));
  },
  async create(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const { data, error } = await supabase.from('users').insert([user]).select().single();
    if (error) throw new Error(getErrorMessage(error));
    return { id: String(data.id), name: data.name, email: data.email, role: data.role as UserRole, createdAt: data.created_at };
  },
  async update(id: string, updates: Partial<User>): Promise<void> {
    const { error } = await supabase.from('users').update(updates).eq('id', id);
    if (error) throw new Error(getErrorMessage(error));
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw new Error(getErrorMessage(error));
  },
  async ensureMasterUser() {
    const { data } = await supabase.from('users').select('*').eq('email', 'efilho@essencisbiometano.com.br').maybeSingle();
    if (!data) {
      await this.create({ 
        name: 'Evaldo de Oliveira', 
        email: 'efilho@essencisbiometano.com.br', 
        password: '123', 
        role: UserRole.DEVELOPER 
      });
    }
  }
};

export const areaService = {
  async getAll(): Promise<string[]> {
    const { data, error } = await supabase.from('areas').select('name').order('name');
    if (error) throw new Error(getErrorMessage(error));
    return (data || []).map(a => a.name);
  },
  async add(name: string): Promise<void> {
    await supabase.from('areas').insert([{ name }]);
  },
  async remove(name: string): Promise<void> {
    await supabase.from('areas').delete().eq('name', name);
  }
};

export const equipmentService = {
  async getAllByArea(areaName: string): Promise<Equipment[]> {
    const { data, error } = await supabase.from('equipments').select('*').eq('area_name', areaName).order('name');
    if (error) throw new Error(getErrorMessage(error));
    return (data || []).map(d => this.mapFromDB(d));
  },
  async getAll(): Promise<Equipment[]> {
    const { data, error } = await supabase.from('equipments').select('*').order('area_name');
    if (error) throw new Error(getErrorMessage(error));
    return (data || []).map(d => this.mapFromDB(d));
  },
  async add(equipment: Omit<Equipment, 'id'>): Promise<void> {
    const { error } = await supabase.from('equipments').insert([this.mapToDB(equipment)]);
    if (error) throw new Error(getErrorMessage(error));
  },
  async update(id: string, equipment: Partial<Equipment>): Promise<void> {
    const { error } = await supabase.from('equipments').update(this.mapToDB(equipment)).eq('id', id);
    if (error) throw new Error(getErrorMessage(error));
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('equipments').delete().eq('id', id);
    if (error) throw new Error(getErrorMessage(error));
  },
  mapToDB(eq: any) {
    const dbObj: any = {};
    if (eq.name !== undefined) dbObj.name = eq.name;
    if (eq.areaName !== undefined) dbObj.area_name = eq.areaName;
    if (eq.imageUrl !== undefined) dbObj.image_url = eq.imageUrl;
    if (eq.minRotation !== undefined) dbObj.min_rotation = eq.minRotation;
    if (eq.maxRotation !== undefined) dbObj.max_rotation = eq.maxRotation;
    if (eq.minTemp !== undefined) dbObj.min_temp = eq.minTemp;
    if (eq.maxTemp !== undefined) dbObj.max_temp = eq.maxTemp;
    return dbObj;
  },
  mapFromDB(db: any): Equipment {
    return {
      id: String(db.id),
      name: db.name,
      areaName: db.area_name,
      imageUrl: db.image_url,
      minRotation: db.min_rotation,
      maxRotation: db.max_rotation,
      minTemp: db.min_temp,
      maxTemp: db.max_temp
    };
  }
};

export const issueService = {
  async getAll(): Promise<GUTIssue[]> {
    const { data, error } = await supabase.from('issues').select('*').order('score', { ascending: false });
    if (error) throw new Error(getErrorMessage(error));
    return (data || []).map(item => this.mapFromDB(item));
  },
  async create(issue: Omit<GUTIssue, 'id' | 'createdAt'>): Promise<GUTIssue> {
    const { data, error } = await supabase.from('issues').insert([this.mapToDB(issue)]).select().single();
    if (error) throw new Error(getErrorMessage(error));
    return this.mapFromDB(data);
  },
  async update(id: string, updates: Partial<GUTIssue>): Promise<GUTIssue> {
    const { data, error } = await supabase.from('issues').update(this.mapToDB(updates)).eq('id', id).select().single();
    if (error) throw new Error(getErrorMessage(error));
    return this.mapFromDB(data);
  },
  async delete(id: string): Promise<boolean> {
    await supabase.from('issues').delete().eq('id', id);
    return true;
  },
  mapToDB(issue: any) {
    const dbObj: any = {};
    if (issue.title !== undefined) dbObj.title = issue.title;
    if (issue.description !== undefined) dbObj.description = issue.description;
    if (issue.immediateAction !== undefined) dbObj.immediate_action = issue.immediateAction;
    if (issue.area !== undefined) dbObj.area = issue.area;
    if (issue.gravity !== undefined) dbObj.gravity = issue.gravity;
    if (issue.urgency !== undefined) dbObj.urgency = issue.urgency;
    if (issue.tendency !== undefined) dbObj.tendency = issue.tendency;
    if (issue.score !== undefined) dbObj.score = issue.score;
    if (issue.status !== undefined) dbObj.status = issue.status;
    if (issue.aiSuggestion !== undefined) dbObj.ai_suggestion = issue.aiSuggestion;
    if (issue.aiActionSuggestion !== undefined) dbObj.ai_action_suggestion = issue.aiActionSuggestion;
    if (issue.attachmentUrl !== undefined) dbObj.attachment_url = issue.attachmentUrl;
    if (issue.attachmentName !== undefined) dbObj.attachment_name = issue.attachmentName;
    return dbObj;
  },
  mapFromDB(dbIssue: any): GUTIssue {
    return {
      id: String(dbIssue.id),
      title: dbIssue.title || '',
      description: dbIssue.description || '',
      immediateAction: dbIssue.immediate_action || '',
      area: dbIssue.area || '',
      gravity: dbIssue.gravity || 1,
      urgency: dbIssue.urgency || 1,
      tendency: dbIssue.tendency || 1,
      score: dbIssue.score || 1,
      status: (dbIssue.status as Status) || Status.OPEN,
      createdAt: dbIssue.created_at || new Date().toISOString(),
      aiSuggestion: dbIssue.ai_suggestion,
      aiActionSuggestion: dbIssue.ai_action_suggestion,
      attachmentUrl: dbIssue.attachment_url,
      attachmentName: dbIssue.attachment_name
    };
  }
};

export const settingsService = {
  async get(): Promise<SystemSettings> {
    const defaults: SystemSettings = { criticalThreshold: 250, warningThreshold: 100, individualCriticalThreshold: 80, individualWarningThreshold: 40, accentColor: '#10b981', colorNormal: '#10b981', colorWarning: '#f59e0b', colorCritical: '#ef4444' };
    const { data } = await supabase.from('settings').select('*').limit(1).maybeSingle();
    if (!data) return defaults;
    return { 
      id: data.id, 
      criticalThreshold: data.critical_threshold, 
      // Fixed: Mapped warning_threshold from DB to warningThreshold to match the SystemSettings interface.
      warningThreshold: data.warning_threshold, 
      individualCriticalThreshold: data.individual_critical_threshold, 
      individualWarningThreshold: data.individual_warning_threshold, 
      accentColor: data.accent_color, 
      colorNormal: data.color_normal, 
      colorWarning: data.color_warning, 
      colorCritical: data.color_critical 
    };
  },
  async update(settings: SystemSettings): Promise<void> {
    const payload = { critical_threshold: settings.criticalThreshold, warning_threshold: settings.warningThreshold, individual_critical_threshold: settings.individualCriticalThreshold, individual_warning_threshold: settings.individualWarningThreshold, accent_color: settings.accentColor, color_normal: settings.colorNormal, color_warning: settings.colorWarning, color_critical: settings.colorCritical };
    if (settings.id) await supabase.from('settings').update(payload).eq('id', settings.id);
    else await supabase.from('settings').insert([payload]);
  }
};

export const thermographyService = {
  async getAll(): Promise<ThermographyRecord[]> {
    const { data, error } = await supabase.from('thermography').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(getErrorMessage(error));
    return (data || []).map(d => ({
      id: String(d.id), equipmentName: d.equipment_name, area: d.area, currentTemp: d.current_temp, maxTemp: d.max_temp, minTemp: d.min_temp, lastInspection: d.last_inspection, notes: d.notes, attachmentUrl: d.attachment_url, attachmentName: d.attachment_name, aiAnalysis: d.ai_analysis, aiRecommendation: d.ai_recommendation, riskLevel: d.risk_level
    }));
  },
  async create(record: Omit<ThermographyRecord, 'id'>): Promise<ThermographyRecord> {
    const { data, error } = await supabase.from('thermography').insert([{ equipment_name: record.equipmentName, area: record.area, current_temp: record.currentTemp, max_temp: record.max_temp, min_temp: record.min_temp, last_inspection: record.lastInspection, notes: record.notes, attachment_url: record.attachmentUrl, attachment_name: record.attachmentName, ai_analysis: record.aiAnalysis, ai_recommendation: record.aiRecommendation, risk_level: record.riskLevel }]).select().single();
    if (error) throw new Error(getErrorMessage(error));
    return { id: String(data.id), ...record };
  },
  async delete(id: string): Promise<void> {
    await supabase.from('thermography').delete().eq('id', id);
  }
};
