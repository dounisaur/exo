--
-- PostgreSQL database dump
--


-- Dumped from database version 17.9 (Homebrew)
-- Dumped by pg_dump version 17.10 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: applied_migrations; Type: TABLE DATA; Schema: public; Owner: andrew
--

INSERT INTO public.applied_migrations VALUES (5, 1, 'initial_schema', '2026-06-10 23:02:40.639008+10');
INSERT INTO public.applied_migrations VALUES (6, 2, 'role_constraint', '2026-06-10 23:02:40.639008+10');
INSERT INTO public.applied_migrations VALUES (7, 3, 'add_opening_hours', '2026-06-10 23:02:40.639008+10');
INSERT INTO public.applied_migrations VALUES (8, 4, 'add_opening_hours_json', '2026-06-10 23:02:40.639008+10');


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: andrew
--

INSERT INTO public.categories VALUES (1, 'Food', 'food');
INSERT INTO public.categories VALUES (2, 'Drinks', 'drinks');
INSERT INTO public.categories VALUES (3, 'Concert', 'concert');
INSERT INTO public.categories VALUES (4, 'Cafe', 'cafe');


--
-- Data for Name: subcategories; Type: TABLE DATA; Schema: public; Owner: andrew
--

INSERT INTO public.subcategories VALUES (1, 1, 'Street Food', 'street-food');
INSERT INTO public.subcategories VALUES (2, 1, 'Michelin', 'michelin');
INSERT INTO public.subcategories VALUES (3, 1, 'Taverna', 'taverna');
INSERT INTO public.subcategories VALUES (4, 1, 'Gastro Taverna', 'gastro-taverna');
INSERT INTO public.subcategories VALUES (5, 1, 'Asian', 'asian');
INSERT INTO public.subcategories VALUES (6, 1, 'Indian', 'indian');
INSERT INTO public.subcategories VALUES (7, 1, 'Seafood', 'seafood');
INSERT INTO public.subcategories VALUES (8, 1, 'Steak house', 'steak-house');
INSERT INTO public.subcategories VALUES (9, 1, 'Souvlakia', 'souvlakia');
INSERT INTO public.subcategories VALUES (10, 2, 'Cocktails', 'cocktails');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: andrew
--

INSERT INTO public.users VALUES (1, 'admin', '$2b$10$daT87KUbIlaJH6RdN0UWO.U0jP.ZGuPXOlvvdLJKD.392ChWHCAIi', 'admin', '2026-06-02 15:24:16+10');


--
-- Data for Name: venues; Type: TABLE DATA; Schema: public; Owner: andrew
--

INSERT INTO public.venues VALUES (1, 'Garum Athens', 'food', 4, 37.9632263, 23.734458, 'Kelsou 10, Athina 116 36, Greece', NULL, 'https://www.garumathens.gr/', '21 0923 6798', NULL, 4.8, 'published', '2026-06-03 06:47:08+10', '2026-06-03 06:47:27+10', NULL);
INSERT INTO public.venues VALUES (2, 'φιλινγκς | more feelings', 'food', 4, 37.9632177, 23.7238395, 'Anastasiou Zinni 34, Athina 117 41, Greece', NULL, NULL, '21 0923 3637', NULL, 2.6, 'published', '2026-06-03 07:16:18+10', '2026-06-03 07:17:08+10', NULL);
INSERT INTO public.venues VALUES (3, 'CTC Urban Gastronomy', 'food', 2, 37.9804945, 23.7168896, 'Plateon 15, Athina 104 35, Greece', NULL, 'http://www.ctc-restaurant.com/', '21 0722 8812', NULL, 4.7, 'published', '2026-06-03 07:16:55+10', '2026-06-03 08:53:41+10', NULL);
INSERT INTO public.venues VALUES (5, 'GOUR gour', 'food', 9, 37.9723126, 23.7551885, 'Efroniou 71, Kesariani 161 21, Greece', NULL, 'https://www.facebook.com/pages/category/Barbecue-Restaurant/%CE%93%CE%9F%CE%A5%CE%A1-%CE%B3%CE%BF%CF%85%CF%81-566462037076062/', '21 0724 5004', NULL, NULL, 'published', '2026-06-03 12:07:17+10', '2026-06-03 12:07:24+10', NULL);
INSERT INTO public.venues VALUES (6, 'Hippy3', 'drinks', 10, 37.9699505, 23.747711, 'Spirou Merkouri 22A, Athina 116 34', NULL, NULL, '2107251154', NULL, 4, 'published', '2026-06-03 12:25:39+10', '2026-06-03 12:45:07+10', NULL);
INSERT INTO public.venues VALUES (7, 'PONY CLUB', 'drinks', 10, 37.9744509, 23.7508946, 'Leof. Vasileos Alexandrou 5-7, Athina 115 28, Greece', NULL, NULL, '21 0723 3071', NULL, 4.3, 'published', '2026-06-03 13:04:26+10', '2026-06-03 13:04:28+10', NULL);


--
-- Name: applied_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: andrew
--

SELECT pg_catalog.setval('public.applied_migrations_id_seq', 8, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: andrew
--

SELECT pg_catalog.setval('public.categories_id_seq', 4, true);


--
-- Name: subcategories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: andrew
--

SELECT pg_catalog.setval('public.subcategories_id_seq', 10, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: andrew
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: venues_id_seq; Type: SEQUENCE SET; Schema: public; Owner: andrew
--

SELECT pg_catalog.setval('public.venues_id_seq', 7, true);


--
-- PostgreSQL database dump complete
--


