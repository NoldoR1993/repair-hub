
-- Create enum for request status
CREATE TYPE public.request_status AS ENUM ('new', 'assigned', 'in_progress', 'done', 'canceled');

-- Create enum for user role
CREATE TYPE public.app_role AS ENUM ('dispatcher', 'master');

-- Create staff table (simplified, no auth needed for demo)
CREATE TABLE public.staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create requests table
CREATE TABLE public.requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  problem_text TEXT NOT NULL,
  status request_status NOT NULL DEFAULT 'new',
  assigned_to UUID REFERENCES public.staff(id),
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit log table
CREATE TABLE public.audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  old_status request_status,
  new_status request_status NOT NULL,
  changed_by UUID REFERENCES public.staff(id),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Public read/write policies for demo (no auth)
CREATE POLICY "Allow all access to staff" ON public.staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to requests" ON public.requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to audit_log" ON public.audit_log FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function for optimistic locking on status update
CREATE OR REPLACE FUNCTION public.update_request_status(
  p_request_id UUID,
  p_new_status request_status,
  p_expected_version INT,
  p_changed_by UUID DEFAULT NULL,
  p_assigned_to UUID DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, current_version INT, current_status request_status) AS $$
DECLARE
  v_old_status request_status;
  v_current_version INT;
BEGIN
  -- Lock the row
  SELECT r.version, r.status INTO v_current_version, v_old_status
  FROM public.requests r WHERE r.id = p_request_id FOR UPDATE;

  IF v_current_version != p_expected_version THEN
    RETURN QUERY SELECT false, v_current_version, v_old_status;
    RETURN;
  END IF;

  -- Update the request
  UPDATE public.requests
  SET status = p_new_status,
      version = version + 1,
      assigned_to = COALESCE(p_assigned_to, requests.assigned_to)
  WHERE id = p_request_id;

  -- Insert audit log
  INSERT INTO public.audit_log (request_id, old_status, new_status, changed_by, note)
  VALUES (p_request_id, v_old_status, p_new_status, p_changed_by,
    'Status changed from ' || v_old_status::text || ' to ' || p_new_status::text);

  RETURN QUERY SELECT true, v_current_version + 1, p_new_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
