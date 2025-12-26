
import { createClient } from '@supabase/supabase-js';
import { GUTIssue, Status } from '../types';

const supabaseUrl = 'https://ffzwavnqpeuqqidotsyp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmendhdm5xcGV1cXFpZG90c3lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NDA4NjMsImV4cCI6MjA3NzIxNjg2M30.r5-ONF9TldNq0mstFh47jwdklEyx6v8dWErRPRQ5__Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * IMPORTANTE: Certifique-se de que as colunas abaixo existem na sua tabela 'issues':
 * attachment_url (text)
 * attachment_name (text)
 * immediate_action (text)
 * ai_suggestion (text)
 */

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
    const payload = this.mapToDB(issue);
    
    const { data, error } = await supabase
      .from('issues')
      .insert([payload])
      .select()
      .single();
    
    if (error) throw error;
    return this.mapFromDB(data);
  },

  async update(id: string, updates: Partial<GUTIssue>) {
    const payload = this.mapToDB(updates);

    const { data, error } = await supabase
      .from('issues')
      .update(payload)
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
    // Criamos um objeto apenas com as chaves que possuem valores definidos
    // Isso evita o erro de "coluna não encontrada" se o campo estiver vazio e a coluna não existir no DB
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
      attachmentUrl: dbIssue.attachment_url,
      attachmentName: dbIssue.attachment_name
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
