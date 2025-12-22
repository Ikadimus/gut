import { createClient } from '@supabase/supabase-js';
import { GUTIssue, Status } from '../types';

const supabaseUrl = 'https://ffzwavnqpeuqqidotsyp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmendhdm5xcGV1cXFpZG90c3lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NDA4NjMsImV4cCI6MjA3NzIxNjg2M30.r5-ONF9TldNq0mstFh47jwdklEyx6v8dWErRPRQ5__Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const issueService = {
  async getAll() {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .order('score', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(this.mapFromDB);
  },

  async create(issue: Omit<GUTIssue, 'id' | 'createdAt'>) {
    const { data, error } = await supabase
      .from('issues')
      .insert([this.mapToDB(issue)])
      .select()
      .single();
    
    if (error) throw error;
    return this.mapFromDB(data);
  },

  async update(id: string, updates: Partial<GUTIssue>) {
    const dbUpdates = this.mapToDB(updates);
    const filteredUpdates = Object.fromEntries(
      Object.entries(dbUpdates).filter(([_, v]) => v !== undefined)
    );

    const { data, error } = await supabase
      .from('issues')
      .update(filteredUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapFromDB(data);
  },

  async delete(id: string) {
    if (!id) throw new Error("ID do registro não identificado.");
    
    const { error } = await supabase
      .from('issues')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Falha na exclusão do banco: ${error.message}`);
    }
    
    return true;
  },

  mapToDB(issue: any) {
    return {
      title: issue.title,
      description: issue.description,
      immediate_action: issue.immediateAction,
      area: issue.area,
      gravity: issue.gravity,
      urgency: issue.urgency,
      tendency: issue.tendency,
      score: issue.score,
      status: issue.status,
      ai_suggestion: issue.aiSuggestion
    };
  },

  mapFromDB(dbIssue: any): GUTIssue {
    return {
      id: String(dbIssue.id),
      title: dbIssue.title,
      description: dbIssue.description,
      immediateAction: dbIssue.immediate_action,
      area: dbIssue.area,
      gravity: dbIssue.gravity,
      urgency: dbIssue.urgency,
      tendency: dbIssue.tendency,
      score: dbIssue.score,
      status: dbIssue.status as Status,
      createdAt: dbIssue.created_at || new Date().toISOString(),
      aiSuggestion: dbIssue.ai_suggestion
    };
  }
};

export const areaService = {
  async getAll() {
    const { data, error } = await supabase
      .from('areas')
      .select('name')
      .order('name');
    if (error) throw error;
    return (data || []).map(a => a.name);
  },
  async add(name: string) {
    const { error } = await supabase.from('areas').insert([{ name }]);
    if (error) throw error;
  },
  async remove(name: string) {
    const { error } = await supabase.from('areas').delete().eq('name', name);
    if (error) throw error;
  },
  async update(oldName: string, newName: string) {
    const { error } = await supabase.from('areas').update({ name: newName }).eq('name', oldName);
    if (error) throw error;
  }
};