# Backend Database Schema

This folder contains the database schema for the Unify app.

## Files

- `schema.sql` - Complete database schema for Supabase PostgreSQL
- `dummydata.sql` - Sample data for testing (optional)

## Usage

The frontend connects directly to Supabase, so this schema is used to set up the database tables in your Supabase project.

## Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `schema.sql`
4. Run the SQL to create all tables

This schema includes:
- Users and authentication
- Posts and social features
- Learning modules and progress tracking
- Events and groups
- All necessary relationships and constraints
