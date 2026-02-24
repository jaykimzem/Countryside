import { redirect } from 'next/navigation';

// The homepage is served as a static file from /public/index.html
// Next.js serves /tour as the 3D tour experience
export default function RootPage() {
  redirect('/index.html');
}
