<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared("
            DO $$
            DECLARE
                rec RECORD;
                seq_name TEXT;
            BEGIN
                FOR rec IN
                    SELECT t.table_name 
                    FROM information_schema.tables t
                    JOIN information_schema.columns c ON t.table_name = c.table_name
                    WHERE t.table_schema = 'public' 
                      AND t.table_type = 'BASE TABLE'
                      AND c.column_name = 'id'
                LOOP
                    seq_name := pg_get_serial_sequence('public.' || rec.table_name, 'id');
                    
                    IF seq_name IS NOT NULL THEN
                        EXECUTE format('SELECT setval(%L, COALESCE(MAX(id), 1)) FROM public.%I', seq_name, rec.table_name);
                    END IF;
                END LOOP;
            END;
            $$ LANGUAGE plpgsql;
        ");
    }

    public function down(): void
    {
    }
};