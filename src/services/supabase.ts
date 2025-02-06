import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ikstbgolebgctnjqseko.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlrc3RiZ29sZWJnY3RuanFzZWtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4MTY1ODcsImV4cCI6MjA1NDM5MjU4N30.Ch0r-0PPho7grAJTB4O9GdpxpDROm-a2n1hAcWv4fmk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
