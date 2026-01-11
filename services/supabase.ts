
import { createClient } from '@supabase/supabase-js';
import { GUTIssue, Status, ThermographyRecord, SystemSettings, User, UserRole, Equipment, RolePermissions } from '../types';

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
  async uploadFile(file: File, bucket: string): Promise<{ url: string; name: string }> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(getErrorMessage(uploadError));
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      url: publicUrl,
      name: file.name
    };
  },
  async deleteFile(url: string): Promise<void> {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const publicIdx = pathParts.indexOf('public');
      if (publicIdx !== -1 && pathParts.length > publicIdx + 2) {
        const bucket = pathParts[publicIdx + 1];
        const filePath = pathParts.slice(publicIdx + 2).join('/');
        const { error } = await supabase.storage.from(bucket).remove([filePath]);
        if (error) throw new Error(getErrorMessage(error));
      }
    } catch (e) {
      console.error("Error deleting file:", e);
    }
  }
};

export const sectorService = {
  async getAll(): Promise<string[]> {
    const { data, error } = await supabase.from('sectors').select('name').order('name');
    if (error) throw new Error(getErrorMessage(error));
    return (data || []).map(s => s.name);
  },
  async add(name: string): Promise<void> {
    await supabase.from('sectors').insert([{ name }]);
  },
  async remove(name: string): Promise<void> {
    await supabase.from('sectors').delete().eq('name', name);
  }
};

export const permissionService = {
  async getAll(): Promise<RolePermissions[]> {
    const { data, error } = await supabase.from('role_permissions').select('*').order('role');
    if (error) throw new Error(getErrorMessage(error));
    return (data || []).map(d => ({
      role: d.role,
      can_view_dashboard: d.can_view_dashboard,
      can_view_sector: d.can_view_sector,
      can_view_gut: d.can_view_gut,
      can_view_thermo: d.can_view_thermo,
      can_view_assets: d.can_view_assets,
      can_view_users: d.can_view_users,
      can_view_settings: d.can_view_settings,
      can_view_reports: d.can_view_reports || false
    }));
  },
  async create(role: string): Promise<void> {
    const { error } = await supabase.from('role_permissions').insert([{
      role,
      can_view_dashboard: true,
      can_view_sector: true,
      can_view_gut: true,
      can_view_thermo: true,
      can_view_assets: true,
      can_view_users: false,
      can_view_settings: false,
      can_view_reports: false
    }]);
    if (error) throw new Error(getErrorMessage(error));
  },
  async update(role: string, permissions: Partial<RolePermissions>): Promise<void> {
    const dbPayload: any = {};
    if (permissions.can_view_dashboard !== undefined) dbPayload.can_view_dashboard = permissions.can_view_dashboard;
    if (permissions.can_view_sector !== undefined) dbPayload.can_view_sector = permissions.can_view_sector;
    if (permissions.can_view_gut !== undefined) dbPayload.can_view_gut = permissions.can_view_gut;
    if (permissions.can_view_thermo !== undefined) dbPayload.can_view_thermo = permissions.can_view_thermo;
    if (permissions.can_view_assets !== undefined) dbPayload.can_view_assets = permissions.can_view_assets;
    if (permissions.can_view_users !== undefined) dbPayload.can_view_users = permissions.can_view_users;
    if (permissions.can_view_settings !== undefined) dbPayload.can_view_settings = permissions.can_view_settings;
    if (permissions.can_view_reports !== undefined) dbPayload.can_view_reports = permissions.can_view_reports;

    const { error } = await supabase.from('role_permissions').update(dbPayload).eq('role', role);
    if (error) throw new Error(getErrorMessage(error));
  },
  async remove(role: string): Promise<void> {
    const { error } = await supabase.from('role_permissions').delete().eq('role', role);
    if (error) throw new Error(getErrorMessage(error));
  }
};

export const userService = {
  async login(email: string, password: string): Promise<User | null> {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).eq('password', password).maybeSingle();
    if (error) throw new Error(getErrorMessage(error));
    if (!data) return null;
    return { id: String(data.id), name: data.name, email: data.email, role: data.role, sector: data.sector, createdAt: data.created_at };
  },
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*').order('name');
    if (error) throw new Error(getErrorMessage(error));
    return (data || []).map(d => ({ id: String(d.id), name: d.name, email: d.email, role: d.role, sector: d.sector, createdAt: data.created_at }));
  },
  async create(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const { data, error } = await supabase.from('users').insert([{
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
      sector: user.sector
    }]).select().single();
    if (error) throw new Error(getErrorMessage(error));
    return { id: String(data.id), name: data.name, email: data.email, role: data.role, sector: data.sector, createdAt: data.created_at };
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
        role: UserRole.DEVELOPER,
        sector: 'Engenharia de Software'
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
    const { data, error } = await supabase.from('equipments').select('*').eq('area_name', areaName).order('tag');
    if (error) throw new Error(getErrorMessage(error));
    return (data || []).map(d => this.mapFromDB(d));
  },
  async getAll(): Promise<Equipment[]> {
    const { data, error } = await supabase.from('equipments').select('*').order('tag');
    if (error) throw new Error(getErrorMessage(error));
    return (data || []).map(d => this.mapFromDB(d));
  },
  async getByName(name: string): Promise<Equipment | null> {
    const { data, error } = await supabase.from('equipments').select('*').eq('name', name).maybeSingle();
    if (error || !data) return null;
    return this.mapFromDB(data);
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
    const setIfValid = (dbKey: string, val: any) => {
      if (val !== undefined && val !== '' && val !== null) {
        dbObj[dbKey] = val;
      }
    };
    if (eq.tag !== undefined) dbObj.tag = eq.tag;
    if (eq.name !== undefined) dbObj.name = eq.name;
    if (eq.areaName !== undefined) dbObj.area_name = eq.areaName;
    setIfValid('image_url', eq.imageUrl);
    setIfValid('min_rotation', eq.minRotation);
    setIfValid('max_rotation', eq.maxRotation);
    setIfValid('min_temp', eq.minTemp);
    setIfValid('max_temp', eq.maxTemp);
    setIfValid('last_maintenance', eq.lastMaintenance);
    setIfValid('last_lubrication', eq.lastLubrication);
    setIfValid('technical_description', eq.technicalDescription);
    setIfValid('installation_date', eq.installationDate);
    return dbObj;
  },
  mapFromDB(db: any): Equipment {
    return {
      id: String(db.id),
      tag: db.tag || '',
      name: db.name,
      areaName: db.area_name,
      imageUrl: db.image_url,
      minRotation: db.min_rotation,
      maxRotation: db.max_rotation,
      minTemp: db.min_temp,
      maxTemp: db.max_temp,
      lastMaintenance: db.last_maintenance,
      lastLubrication: db.last_lubrication,
      technicalDescription: db.technical_description,
      installationDate: db.installation_date
    };
  }
};

export const issueService = {
  async getAll(): Promise<GUTIssue[]> {
    const { data, error } = await supabase.from('issues').select('*').order('score', { ascending: false });
    if (error) throw new Error(getErrorMessage(error));
    return (data || []).map(item => this.mapFromDB(item));
  },
  async getByEquipment(name: string): Promise<GUTIssue[]> {
    const { data, error } = await supabase.from('issues').select('*').eq('equipment_name', name).order('created_at', { ascending: false });
    if (error) return [];
    return (data || []).map(item => this.mapFromDB(item));
  },
  async create(issue: Omit<GUTIssue, 'id' | 'createdAt'>): Promise<GUTIssue> {
    const { data, error = null } = await supabase.from('issues').insert([this.mapToDB(issue)]).select().single();
    if (error) throw new Error(getErrorMessage(error));
    return this.mapFromDB(data);
  },
  async update(id: string, updates: Partial<GUTIssue>): Promise<GUTIssue> {
    const { data, error = null } = await supabase.from('issues').update(this.mapToDB(updates)).eq('id', id).select().single();
    if (error) throw new Error(getErrorMessage(error));
    return this.mapFromDB(data);
  },
  async delete(id: string): Promise<boolean> {
    await supabase.from('issues').delete().eq('id', id);
    return true;
  },
  mapToDB(issue: any) {
    const dbObj: any = {};
    const setIfValid = (dbKey: string, val: any) => {
      if (val !== undefined && val !== '' && val !== null) {
        dbObj[dbKey] = val;
      }
    };
    if (issue.title !== undefined) dbObj.title = issue.title;
    if (issue.description !== undefined) dbObj.description = issue.description;
    if (issue.area !== undefined) dbObj.area = issue.area;
    if (issue.gravity !== undefined) dbObj.gravity = issue.gravity;
    if (issue.urgency !== undefined) dbObj.urgency = issue.urgency;
    if (issue.tendency !== undefined) dbObj.tendency = issue.tendency;
    if (issue.score !== undefined) dbObj.score = issue.score;
    if (issue.status !== undefined) dbObj.status = issue.status;
    setIfValid('immediate_action', issue.immediateAction);
    setIfValid('equipment_name', issue.equipmentName);
    setIfValid('ai_suggestion', issue.aiSuggestion);
    setIfValid('ai_action_suggestion', issue.aiActionSuggestion);
    setIfValid('attachment_url', issue.attachmentUrl);
    setIfValid('attachment_name', issue.attachmentName);
    setIfValid('resolution', issue.resolution);
    setIfValid('ai_resolution_evaluation', issue.aiResolutionEvaluation);
    return dbObj;
  },
  mapFromDB(dbIssue: any): GUTIssue {
    return {
      id: String(dbIssue.id),
      title: dbIssue.title || '',
      description: dbIssue.description || '',
      immediateAction: dbIssue.immediate_action || '',
      area: dbIssue.area || '',
      equipmentName: dbIssue.equipment_name,
      gravity: dbIssue.gravity || 1,
      urgency: dbIssue.urgency || 1,
      tendency: dbIssue.tendency || 1,
      score: dbIssue.score || 1,
      status: (dbIssue.status as Status) || Status.OPEN,
      createdAt: dbIssue.created_at || new Date().toISOString(),
      aiSuggestion: dbIssue.ai_suggestion,
      // Fix: Mapped correctly to camelCase interface property
      aiActionSuggestion: dbIssue.ai_action_suggestion,
      attachmentUrl: dbIssue.attachment_url,
      attachmentName: dbIssue.attachment_name,
      resolution: dbIssue.resolution,
      aiResolutionEvaluation: dbIssue.ai_resolution_evaluation
    };
  }
};

export const thermographyService = {
  async getAll(): Promise<ThermographyRecord[]> {
    const { data, error } = await supabase.from('thermography').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(getErrorMessage(error));
    return (data || []).map(d => this.mapFromDB(d));
  },
  async getByEquipment(name: string): Promise<ThermographyRecord[]> {
    const { data, error } = await supabase.from('thermography').select('*').eq('equipment_name', name).order('created_at', { ascending: false });
    if (error) return [];
    return (data || []).map(d => this.mapFromDB(d));
  },
  async create(record: Omit<ThermographyRecord, 'id' | 'createdAt'>): Promise<ThermographyRecord> {
    const dbPayload: any = { 
      equipment_name: record.equipmentName, 
      area: record.area, 
      current_temp: record.currentTemp, 
      max_temp: record.maxTemp, 
      min_temp: record.minTemp
    };
    const setIfValid = (dbKey: string, val: any) => {
      if (val !== undefined && val !== '' && val !== null) {
        dbPayload[dbKey] = val;
      }
    };
    setIfValid('last_inspection', record.lastInspection);
    setIfValid('notes', record.notes);
    setIfValid('attachment_url', record.attachmentUrl);
    setIfValid('attachment_name', record.attachmentName);
    setIfValid('ai_analysis', record.aiAnalysis);
    setIfValid('ai_recommendation', record.aiRecommendation);
    setIfValid('risk_level', record.riskLevel);
    const { data, error } = await supabase.from('thermography').insert([dbPayload]).select().single();
    if (error) throw new Error(getErrorMessage(error));
    return this.mapFromDB(data);
  },
  async update(id: string, record: Partial<ThermographyRecord>): Promise<ThermographyRecord> {
    const dbObj: any = {};
    const setIfValid = (dbKey: string, val: any) => {
      if (val !== undefined && val !== '' && val !== null) {
        dbObj[dbKey] = val;
      }
    };
    if (record.equipmentName !== undefined) dbObj.equipment_name = record.equipmentName;
    if (record.area !== undefined) dbObj.area = record.area;
    if (record.currentTemp !== undefined) dbObj.current_temp = record.currentTemp;
    if (record.maxTemp !== undefined) dbObj.max_temp = record.maxTemp;
    if (record.minTemp !== undefined) dbObj.min_temp = record.minTemp;
    setIfValid('last_inspection', record.lastInspection);
    setIfValid('notes', record.notes);
    setIfValid('attachment_url', record.attachmentUrl);
    setIfValid('attachment_name', record.attachmentName);
    setIfValid('ai_analysis', record.aiAnalysis);
    setIfValid('ai_recommendation', record.aiRecommendation);
    setIfValid('risk_level', record.riskLevel);
    const { data, error } = await supabase.from('thermography').update(dbObj).eq('id', id).select().single();
    if (error) throw new Error(getErrorMessage(error));
    return this.mapFromDB(data);
  },
  async delete(id: string): Promise<void> {
    await supabase.from('thermography').delete().eq('id', id);
  },
  mapFromDB(d: any): ThermographyRecord {
    return {
      id: String(d.id), 
      equipmentName: d.equipment_name, 
      area: d.area, 
      currentTemp: d.current_temp, 
      maxTemp: d.max_temp, 
      minTemp: d.min_temp, 
      lastInspection: d.last_inspection, 
      createdAt: d.created_at, 
      notes: d.notes, 
      attachmentUrl: d.attachment_url, 
      attachmentName: d.attachment_name, 
      aiAnalysis: d.ai_analysis, 
      aiRecommendation: d.ai_recommendation, 
      riskLevel: d.risk_level
    };
  }
};

export const settingsService = {
  async get(): Promise<SystemSettings> {
    const defaults: SystemSettings = { criticalThreshold: 250, warningThreshold: 100, individualCriticalThreshold: 80, individualWarningThreshold: 40, accentColor: '#10b981', colorNormal: '#10b981', colorWarning: '#f59e0b', colorCritical: '#ef4444' };
    const { data } = await supabase.from('settings').select('*').limit(1).maybeSingle();
    if (!data) return defaults;
    // Fix: Using correct camelCase property names defined in SystemSettings interface
    return { 
      id: data.id, 
      criticalThreshold: data.critical_threshold, 
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
    const payload = { 
      critical_threshold: settings.criticalThreshold, 
      warning_threshold: settings.warningThreshold, 
      individual_critical_threshold: settings.individualCriticalThreshold, 
      individual_warning_threshold: settings.individualWarningThreshold, 
      accent_color: settings.accentColor, 
      color_normal: settings.colorNormal, 
      color_warning: settings.colorWarning, 
      color_critical: settings.colorCritical 
    };
    if (settings.id) await supabase.from('settings').update(payload).eq('id', settings.id);
    else await supabase.from('settings').insert([payload]);
  }
};
