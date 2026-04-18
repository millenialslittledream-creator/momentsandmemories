CREATE OR REPLACE FUNCTION sum_revenue()
RETURNS TABLE(sum NUMERIC) AS $$
  SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE status IN ('paid','shipped','delivered');
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_growth_by_day(days_back INTEGER DEFAULT 30)
RETURNS TABLE(day DATE, count BIGINT) AS $$
  SELECT DATE(created_at) as day, COUNT(*) as count
  FROM public.users
  WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY DATE(created_at)
  ORDER BY day;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION order_stats_by_day(days_back INTEGER DEFAULT 30)
RETURNS TABLE(day DATE, order_count BIGINT, revenue NUMERIC) AS $$
  SELECT DATE(created_at) as day, COUNT(*) as order_count, SUM(total_amount) as revenue
  FROM public.orders
  WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY DATE(created_at)
  ORDER BY day;
$$ LANGUAGE sql SECURITY DEFINER;
