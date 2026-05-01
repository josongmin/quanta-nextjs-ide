import { create } from 'zustand';
import { matchContracts, type ApiContract } from './matcher';
import { scanCallers, scanHandlers, type SourceFile } from './scanner';
import { diffContracts, type ContractChange } from './diff';
import {
  scanExternalRisks,
  type ExternalCallRisk,
} from './external-risk';

const FRONTEND_FILES: SourceFile[] = [
  {
    file: 'app/dashboard/page.tsx',
    source: `
'use client';
import useSWR from 'swr';
export default function Dashboard() {
  const { data } = useSWR('/api/projects', (u) => fetch(u).then(r => r.json()));
  return <List items={data} />;
}
`,
  },
  {
    file: 'components/CreateProject.tsx',
    source: `
'use client';
import axios from 'axios';
export function CreateProject() {
  const submit = async (input: { name: string }) => {
    await axios.post('/api/projects', input);
  };
  return <Form onSubmit={submit} />;
}
`,
  },
  {
    file: 'components/Profile.tsx',
    source: `
'use client';
import { trpc } from '@/lib/trpc';
export function Profile() {
  const { data } = trpc.user.profile.useQuery();
  const update = trpc.user.update.useMutation();
  return <UserCard user={data} onSave={update.mutate} />;
}
`,
  },
  {
    file: 'components/PostForm.tsx',
    source: `
'use client';
import { publishPostAction } from '@/app/post/actions';
export function PostForm() {
  return <form action={publishPostAction}><input name="title" /></form>;
}
`,
  },
  {
    file: 'lib/integrations.ts',
    source: `
import Stripe from 'stripe';
import { Resend } from 'resend';
import OpenAI from 'openai';
import { S3Client } from '@aws-sdk/client-s3';

export const stripe = new Stripe(process.env.STRIPE_SECRET!, { timeout: 20000 });
export const resend = new Resend(process.env.RESEND_API_KEY!);
export const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY!, maxRetries: 3 });
export const s3 = new S3Client({ region: 'us-east-1' });
`,
  },
];

const BACKEND_FILES: SourceFile[] = [
  {
    file: 'app/api/projects/route.ts',
    source: `
import { NextResponse } from 'next/server';
type Project = { id: string; name: string; ownerId: string };
export async function GET(): Promise<NextResponse<Project[]>> {
  return NextResponse.json([]);
}
export async function POST(req: Request): Promise<NextResponse<Project>> {
  const body = await req.json();
  return NextResponse.json({ id: '1', name: body.name, ownerId: 'me' });
}
`,
  },
  {
    file: 'app/api/users/[id]/route.ts',
    source: `
import { NextResponse } from 'next/server';
type User = { id: string; email: string; displayName: string };
export async function GET(req: Request, { params }: { params: { id: string } }): Promise<NextResponse<User>> {
  return NextResponse.json({ id: params.id, email: '', displayName: '' });
}
`,
  },
  {
    file: 'app/post/actions.ts',
    source: `
'use server';
import { revalidatePath } from 'next/cache';
type PublishResult = { ok: boolean; postId: string };
export async function publishPostAction(formData: FormData): Promise<PublishResult> {
  return { ok: true, postId: String(formData.get('id')) };
}
`,
  },
];

const BEFORE_BACKEND: SourceFile[] = [
  {
    file: 'app/api/projects/route.ts',
    source: `
import { NextResponse } from 'next/server';
type Project = { id: string; title: string; ownerId: string };
export async function GET(): Promise<NextResponse<Project[]>> {
  return NextResponse.json([]);
}
`,
  },
];

interface ContractStore {
  contracts: ApiContract[];
  changes: ContractChange[];
  externalRisks: ExternalCallRisk[];
  expandedId: string | null;
  setExpanded(id: string | null): void;
}

export const useApiContractLinkStore = create<ContractStore>((set) => {
  const callers = scanCallers(FRONTEND_FILES);
  const handlers = scanHandlers([...FRONTEND_FILES, ...BACKEND_FILES]);
  const contracts = matchContracts(callers, handlers);

  const beforeHandlers = scanHandlers(BEFORE_BACKEND);
  const beforeContracts = matchContracts([], beforeHandlers);
  const changes = diffContracts(beforeContracts, contracts);

  const externalRisks = scanExternalRisks(FRONTEND_FILES);

  return {
    contracts,
    changes,
    externalRisks,
    expandedId: contracts[0]?.id ?? null,
    setExpanded: (id) => set({ expandedId: id }),
  };
});
