-- Insert 4 sample news articles
INSERT INTO news_details (title, description, author, date, content, link, image_link)
VALUES
  (
    'Navigating Winter Roads in Canada',
    'New to snow? ICBC article to help you avoid issues on the icy, winter roads. Learn essential winter driving tips and safety precautions.',
    'ICBC',
    '2024-12-15 10:00:00+00',
    'Winter driving in Canada requires special preparation and knowledge. This comprehensive guide covers everything from tire selection to emergency kits. Always check road conditions before traveling, keep your gas tank at least half full, and carry an emergency kit with blankets, food, and a flashlight. Remember to drive slowly, increase following distance, and avoid sudden movements.',
    'https://www.icbc.com/driver-licensing/winter-driving',
    NULL
  ),
  (
    'Financial Planning Tips for Newcomers',
    'Essential tips for managing your finances in Canada. Learn about banking, credit, taxes, and budgeting strategies.',
    'Financial Advisor',
    '2024-12-10 14:30:00+00',
    'Setting up your financial life in Canada is crucial for long-term success. Start by opening a bank account with one of Canada''s major banks, which offer newcomer packages with special benefits. Building credit history is essential - consider getting a secured credit card and making regular payments. Understanding the Canadian tax system is also important, as you''ll need to file an annual tax return. Create a budget that accounts for housing, transportation, food, and savings.',
    'https://www.canada.ca/en/financial-consumer-agency.html',
    NULL
  ),
  (
    'Understanding Canadian Healthcare System',
    'A comprehensive guide to navigating the Canadian healthcare system and understanding your coverage options.',
    'Health Canada',
    '2024-12-05 09:15:00+00',
    'Canada has a publicly funded healthcare system that provides essential medical services to all residents. Each province and territory manages its own healthcare program. To access healthcare services, you''ll need to apply for a health card in your province or territory, which typically requires proof of residency and identity. Once you have your health card, most basic medical services are covered, including visits to doctors, hospital stays, and emergency care. However, some services like dental care, prescription drugs, and vision care may require additional insurance.',
    'https://www.canada.ca/en/health-canada/services/health-care-system.html',
    NULL
  ),
  (
    'Complete Guide to Settling in Canada',
    'A comprehensive resource covering all aspects of life in Canada for newcomers, from housing to employment to social integration.',
    'Immigration Services Canada',
    '2024-11-28 16:45:00+00',
    'Moving to a new country is an exciting but challenging experience. This comprehensive guide will help you navigate the many aspects of settling in Canada. Understanding Canadian culture is important - Canadians value politeness, respect for others, and a strong sense of community. Finding employment can take time, so start by creating a Canadian-style resume and networking through professional associations. Housing markets can be competitive, especially in major cities, so be prepared with references and proof of income. Building a social network takes time, but community centers and cultural associations offer programs to help newcomers connect.',
    'https://www.canada.ca/en/immigration-refugees-citizenship/services/new-immigrants.html',
    NULL
  );

-- Insert 4 sample events
INSERT INTO events (title, description, event_datetime, event_end_datetime, location, address, event_type, cover_photo_url, external_link, max_attendees)
VALUES
  (
    'Newcomer Welcome Social',
    'Join us for a welcoming social event for newcomers to Canada. Meet other newcomers, share experiences, and build connections in your new community.',
    '2026-01-20 18:00:00+00',
    '2026-01-20 21:00:00+00',
    'Community Center',
    '123 Main Street, Vancouver, BC V6B 1A1',
    'in-person',
    NULL,
    'https://example.com/events/newcomer-welcome',
    50
  ),
  (
    'Financial Literacy Workshop',
    'Learn about Canadian banking, credit, taxes, and budgeting strategies. Perfect for newcomers looking to establish their financial foundation.',
    '2026-01-25 10:00:00+00',
    '2026-01-25 12:00:00+00',
    'Online',
    'Zoom Meeting',
    'online',
    NULL,
    'https://example.com/events/financial-literacy',
    NULL
  ),
  (
    'Job Search Strategies Seminar',
    'Discover effective job search strategies for the Canadian market. Learn about resume writing, networking, and interview techniques.',
    '2026-02-01 14:00:00+00',
    '2026-02-01 16:30:00+00',
    'Career Center',
    '456 Oak Avenue, Toronto, ON M5H 2N2',
    'in-person',
    NULL,
    'https://example.com/events/job-search',
    30
  ),
  (
    'Housing Resources Information Session',
    'Get information about finding and securing housing in Canada. Learn about rental markets, tenant rights, and available resources.',
    '2026-02-10 11:00:00+00',
    '2026-02-10 13:00:00+00',
    'Housing Services Office',
    '789 Pine Street, Montreal, QC H3A 1B2',
    'hybrid',
    NULL,
    'https://example.com/events/housing-resources',
    40
  );

