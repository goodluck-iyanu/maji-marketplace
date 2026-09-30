const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// We have to compile email.ts to JS or just write a small typescript executor.
// We'll use ts-node.
