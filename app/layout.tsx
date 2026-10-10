import type {Metadata} from 'next';
import './globals.css';
import PortalBanner from '@/components/finance/PortalBanner';
export const metadata:Metadata={title:'Folio Finance — Project and CMA Reports',description:'Prepare Indian business loan Project Reports and CMA Reports from confirmed facts and financial schedules.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><a className="skip-link" href="#main-content">Skip to main content</a><PortalBanner/>{children}</body></html>;}
