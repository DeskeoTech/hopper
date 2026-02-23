-- Site closures: allow admins to block reservations on specific dates per site
CREATE TABLE public.site_closures (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id    uuid        NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  date       date        NOT NULL,
  reason     text        NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Prevent duplicate closures for the same site on the same day
CREATE UNIQUE INDEX site_closures_site_id_date_uidx
  ON public.site_closures (site_id, date);

-- Enable RLS
ALTER TABLE public.site_closures ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read (needed for booking guards)
CREATE POLICY "Authenticated users can read site_closures"
  ON public.site_closures FOR SELECT
  USING (auth.role() = 'authenticated');

-- Authenticated users can insert/update/delete (admin check done at app level)
CREATE POLICY "Authenticated users can manage site_closures"
  ON public.site_closures FOR ALL
  USING (auth.role() = 'authenticated');
