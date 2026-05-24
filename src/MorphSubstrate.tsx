import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type Health = 'calm' | 'adaptive' | 'chaotic';
type SpaceType = 'science' | 'social' | 'code' | 'research' | 'app' | 'media' | 'unknown';

type AstEntity = { type: string; name: string };
type AstSnapshot = { type: string; framework?: string; entities: AstEntity[] };

type IngestedFile = {
  id: string;
  name: string;
  type: string;
  content?: string;
  ast_snapshot?: AstSnapshot | null;
  size: number;
};

type Space = {
  id: string;
  name: string;
  type: SpaceType;
  description: string | null;
  files: Array<{ id: string; name: string; type: string; size: number }>;
  share_slug: string;
  created_at: string;
};

type MorphPacket<T> = {
  payload: T;
  meta: {
    systemHealth: Health;
    perturbationVector: number;
    timestamp: number;
    origin: string;
  };
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

class MorphineKernel {
  async propagate<T extends { size?: number; content?: string } | { files?: IngestedFile[] }>(rawInput: T, origin = 'upload'): Promise<MorphPacket<T>> {
    let packet: MorphPacket<T> = {
      payload: rawInput,
      meta: { systemHealth: 'calm', perturbationVector: 0.111111, timestamp: Date.now(), origin },
    };
    packet = await this.environmentalObserver(packet);
    packet = await this.resonanceGNN(packet);
    packet = await this.morphingSubstrate(packet);
    return this.agentBehavior(packet);
  }

  private async environmentalObserver<T>(packet: MorphPacket<T>): Promise<MorphPacket<T>> {
    const payload = packet.payload as any;
    const size = payload.size ?? payload.files?.reduce((sum: number, file: IngestedFile) => sum + file.size, 0) ?? 1;
    packet.meta.perturbationVector += Math.log10(size + 1) / 10;
    return packet;
  }

  private async resonanceGNN<T>(packet: MorphPacket<T>): Promise<MorphPacket<T>> {
    const payload = packet.payload as any;
    const content = payload.content ?? payload.files?.map((file: IngestedFile) => file.content ?? '').join('\n') ?? '';
    const codeDensity = (content.match(/[{}();=]/g) ?? []).length / Math.max(content.length, 1);
    const tension = Math.min(codeDensity * 5 + packet.meta.perturbationVector, 1);
    packet.meta.perturbationVector = tension;
    packet.meta.systemHealth = tension > 0.7 ? 'chaotic' : tension > 0.4 ? 'adaptive' : 'calm';
    return packet;
  }

  private async morphingSubstrate<T>(packet: MorphPacket<T>): Promise<MorphPacket<T>> {
    return packet;
  }

  private async agentBehavior<T>(packet: MorphPacket<T>): Promise<MorphPacket<T>> {
    return packet;
  }
}

const kernel = new MorphineKernel();

function detectFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const typeMap: Record<string, string> = {
    tsx: 'tsx', jsx: 'jsx', js: 'js', ts: 'ts', py: 'py', html: 'html', htm: 'html', css: 'css', scss: 'scss',
    json: 'json', md: 'markdown', txt: 'text', csv: 'csv', zip: 'zip', png: 'image', jpg: 'image', jpeg: 'image',
    gif: 'image', svg: 'image', pdf: 'pdf', webp: 'image', mp4: 'media', mp3: 'media', wav: 'media'
  };
  return typeMap[ext] ?? 'unknown';
}

async function parseAST(content: string, fileType: string): Promise<AstSnapshot> {
  const snapshot: AstSnapshot = { type: fileType, entities: [] };
  if (['tsx', 'jsx', 'js', 'ts'].includes(fileType)) {
    const components = [...content.matchAll(/(?:function|const|class)\s+([A-Z][A-Za-z0-9]*)/g)].map(match => match[1]);
    const hooks = [...content.matchAll(/use[A-Z][A-Za-z0-9]*/g)].map(match => match[0]);
    const imports = [...content.matchAll(/import\s+.*?from\s+['\"]([^'\"]+)['\"]/g)].map(match => match[1]);
    snapshot.entities = [
      ...components.map(name => ({ type: 'component', name })),
      ...hooks.map(name => ({ type: 'hook', name })),
      ...imports.map(name => ({ type: 'dependency', name })),
    ];
    snapshot.framework = 'react-or-js';
  }
  if (fileType === 'py') {
    const functions = [...content.matchAll(/def\s+([a-z_][a-z0-9_]*)/gi)].map(match => match[1]);
    const classes = [...content.matchAll(/class\s+([A-Z][A-Za-z0-9_]*)/g)].map(match => match[1]);
    const imports = [...content.matchAll(/(?:import|from)\s+([a-z_][a-z0-9_.]*)/gi)].map(match => match[1]);
    snapshot.entities = [
      ...functions.map(name => ({ type: 'function', name })),
      ...classes.map(name => ({ type: 'class', name })),
      ...imports.map(name => ({ type: 'module', name })),
    ];
    snapshot.framework = 'python';
  }
  if (fileType === 'html') {
    const title = content.match(/<title>(.*?)<\/title>/)?.[1] ?? '';
    const links = [...content.matchAll(/href=['\"]([^'\"]+)['\"]/g)].map(match => match[1]);
    snapshot.entities = [{ type: 'title', name: title }, ...links.map(name => ({ type: 'link', name }))];
    snapshot.framework = 'html';
  }
  if (fileType === 'json') {
    try {
      snapshot.entities = Object.keys(JSON.parse(content)).map(name => ({ type: 'key', name }));
      snapshot.framework = 'json';
    } catch {
      snapshot.entities = [{ type: 'json', name: 'invalid-json' }];
    }
  }
  return snapshot;
}

function classifySpace(files: IngestedFile[]): { name: string; type: SpaceType; description: string } {
  const types = files.map(file => file.type);
  const hasReact = types.some(type => ['tsx', 'jsx'].includes(type));
  const hasPython = types.includes('py');
  const hasHTML = types.includes('html');
  const hasMarkdown = types.includes('markdown');
  const hasJSON = types.includes('json');
  const hasMedia = types.some(type => ['image', 'media', 'pdf'].includes(type));
  if (hasReact || (hasReact && hasHTML)) return { name: 'Web App', type: 'app', description: 'Interactive web application substrate' };
  if (hasPython) return { name: 'Science Lab', type: 'science', description: 'Python-based research or computation tools' };
  if (hasHTML) return { name: 'Website', type: 'social', description: 'Static web presence or page archive' };
  if (hasMarkdown && files.length > 1) return { name: 'Research Archive', type: 'research', description: 'Documented knowledge base' };
  if (hasJSON && files.length < 3) return { name: 'Configuration', type: 'code', description: 'System configuration files' };
  if (hasMedia && files.length >= 1) return { name: 'Media Space', type: 'media', description: 'Visual or media material' };
  return { name: 'Mixed Project', type: 'app', description: 'Multi-format project files' };
}

export default function MorphSubstrate() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activeSpace, setActiveSpace] = useState<Space | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [systemHealth, setSystemHealth] = useState<Health>('calm');
  const [perturbation, setPerturbation] = useState(0.111111);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const loadSpaces = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from('spaces').select('*').order('created_at', { ascending: false });
    if (error) showToast(`Load error: ${error.message}`);
    if (data) setSpaces(data as Space[]);
  }, [showToast]);

  useEffect(() => { void loadSpaces(); }, [loadSpaces]);
