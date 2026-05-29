-- Auto-generated APPEND-ONLY protocol import (latest FileMaker extract).
-- Each row inserts only if its serial_text is not already present, so this
-- never overwrites existing protocols and is safe to re-run.
-- Run in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).

BEGIN;

INSERT INTO public.protocols (serial_text, title, approved_title, study_type, submission_type, degree, fast_tracked, submitted_at, final_outcome, meeting_date, meeting_outcome, applicant_email, applicant_firstname, applicant_surname, applicant_title, amendment_letter_status, approval_letter_status, list_amendments, omit_record)
SELECT '2026/372', 'High Grade Lumbar Dysplastic Spondylolisthesis-What Have We Learned? - Evolution Of Surgical Management And Retrospective Review Of Clinico-Radiological Outcomes Of A Single Surgeon Consecutive Series Over A 23-Year Period.', 'High Grade Lumbar Dysplastic Spondylolisthesis-What Have We Learned? - Evolution Of Surgical Management And Retrospective Review Of Clinico-Radiological Outcomes Of A Single Surgeon Consecutive Series Over A 23-Year Period.', NULL, NULL, NULL, TRUE, '2026-04-15T22:39:09', 'approved', '2026-05-15', 'Approved', 'drfidelismunetsi@gmail.com', 'Fidelis', 'Munetsi', 'Dr', NULL, 'Sent', 'retrospective review; MSC degree', FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.protocols WHERE serial_text = '2026/372');

INSERT INTO public.protocols (serial_text, title, approved_title, study_type, submission_type, degree, fast_tracked, submitted_at, final_outcome, meeting_date, meeting_outcome, applicant_email, applicant_firstname, applicant_surname, applicant_title, amendment_letter_status, approval_letter_status, list_amendments, omit_record)
SELECT '2026/373', 'The Impact Of Donor Vessel Multiplicity And Kidney Laterality On Donor Outcomes In A South African Cohort', 'The Impact Of Donor Vessel Multiplicity And Kidney Laterality On Donor Outcomes In A South African Cohort', NULL, NULL, NULL, TRUE, '2026-04-27T18:19:01', 'approved', '2026-05-15', 'Approved', 'cahugo6@gmail.com', 'Carl-Adriaan', 'Hugo', 'Dr', NULL, 'Sent', 'Study using retrospective data at Netcare Christiaan Barnard', FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.protocols WHERE serial_text = '2026/373');

INSERT INTO public.protocols (serial_text, title, approved_title, study_type, submission_type, degree, fast_tracked, submitted_at, final_outcome, meeting_date, meeting_outcome, applicant_email, applicant_firstname, applicant_surname, applicant_title, amendment_letter_status, approval_letter_status, list_amendments, omit_record)
SELECT '2026/374', 'The Global Landscape Of Machine Learning In Orthopaedic Radiology-A Systematic Review.', 'The Global Landscape Of Machine Learning In Orthopaedic Radiology-A Systematic Review.', NULL, NULL, NULL, TRUE, '2026-05-04T22:36:08', 'approved', '2026-05-15', 'Approved', 'nicholas.kruger@uct.ac.za', 'Nicholas', 'Kruger', 'Prof', NULL, 'Sent', 'Systematic review of available literature', FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.protocols WHERE serial_text = '2026/374');

INSERT INTO public.protocols (serial_text, title, approved_title, study_type, submission_type, degree, fast_tracked, submitted_at, final_outcome, meeting_date, meeting_outcome, applicant_email, applicant_firstname, applicant_surname, applicant_title, amendment_letter_status, approval_letter_status, list_amendments, omit_record)
SELECT '2026/375', 'A Ten Year Retrospective Cohort Study On The Early And Mid-Term Mortality And Complication Rates Following Lung Resection For Inflammatory Lung Disease In A High Tb Prevalence Region At Groote Schuur Hospital, Cape Town, South Africa', 'A Ten Year Retrospective Cohort Study On The Early And Mid-Term Mortality And Complication Rates Following Lung Resection For Inflammatory Lung Disease In A High Tb Prevalence Region At Groote Schuur Hospital, Cape Town, South Africa', NULL, NULL, NULL, TRUE, '2026-05-05T15:01:17', 'approved', '2026-05-15', 'Approved', 'Kyle.grebe@gmail.com', 'Kyle', 'Grebe', 'Dr', 'Sent', NULL, 'retrospective folder review', FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.protocols WHERE serial_text = '2026/375');

INSERT INTO public.protocols (serial_text, title, approved_title, study_type, submission_type, degree, fast_tracked, submitted_at, final_outcome, meeting_date, meeting_outcome, applicant_email, applicant_firstname, applicant_surname, applicant_title, amendment_letter_status, approval_letter_status, list_amendments, omit_record)
SELECT '2026/376', 'Prognostic Value Of The Cheng And Vp Classification Systems In Hepatocellular Carcinoma With Portal Vein Tumour Thrombosis: A Southern African Cohort Study', 'Prognostic Value Of The Cheng And Vp Classification Systems In Hepatocellular Carcinoma With Portal Vein Tumour Thrombosis: A Southern African Cohort Study', NULL, NULL, NULL, TRUE, '2026-05-07T15:36:55', 'approved', '2026-05-15', 'Approved', 'eduard.jonas@uct.ac.za', 'Eduard', 'Jonas', 'Prof', NULL, 'Sent', 'retrospective review of database', FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.protocols WHERE serial_text = '2026/376');

INSERT INTO public.protocols (serial_text, title, approved_title, study_type, submission_type, degree, fast_tracked, submitted_at, final_outcome, meeting_date, meeting_outcome, applicant_email, applicant_firstname, applicant_surname, applicant_title, amendment_letter_status, approval_letter_status, list_amendments, omit_record)
SELECT '2026/377', 'Therapeutic Appendicectomy For Ulcerative Colitis (Clarity): An International, Prospective, Observational, Registry Study', 'Therapeutic Appendicectomy For Ulcerative Colitis (Clarity): An International, Prospective, Observational, Registry Study', NULL, NULL, NULL, FALSE, '2026-05-08T16:17:19', 'approved', '2026-05-15', 'Minor amendment', 'mkhwanazinsizwenye@gmail.com', 'Nsizwenye', 'Mkhwanazi', 'Dr', 'Sent', 'Sent', 'Reviewer comments sent to researcher
Revisions received. Approval sent', FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.protocols WHERE serial_text = '2026/377');

INSERT INTO public.protocols (serial_text, title, approved_title, study_type, submission_type, degree, fast_tracked, submitted_at, final_outcome, meeting_date, meeting_outcome, applicant_email, applicant_firstname, applicant_surname, applicant_title, amendment_letter_status, approval_letter_status, list_amendments, omit_record)
SELECT '2026/378', 'Loupe-Only Microvascular Free Tissue Transfer For Lower Limb Reconstruction In A Single Tertiary Hospital In The Western Cape Province, South Africa.', 'Loupe-Only Microvascular Free Tissue Transfer For Lower Limb Reconstruction In A Single Tertiary Hospital In The Western Cape Province, South Africa.', NULL, NULL, NULL, TRUE, '2026-05-08T20:28:33', 'approved', '2026-05-15', 'Approved', 'avgov44@gmail.com', 'Avaan', 'Govindasamy', 'Dr', 'Sent', 'Sent', 'case series', FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.protocols WHERE serial_text = '2026/378');

INSERT INTO public.protocols (serial_text, title, approved_title, study_type, submission_type, degree, fast_tracked, submitted_at, final_outcome, meeting_date, meeting_outcome, applicant_email, applicant_firstname, applicant_surname, applicant_title, amendment_letter_status, approval_letter_status, list_amendments, omit_record)
SELECT '2026/379', '5-Year Retrospective Study On Outcomes Of Percutaneous Nephrolithotomy At Groote Schuur Hospital From 2019 To 2023', '5-Year Retrospective Study On Outcomes Of Percutaneous Nephrolithotomy At Groote Schuur Hospital From 2019 To 2023', NULL, NULL, NULL, TRUE, '2026-05-11T14:01:52', 'approved', '2026-05-15', 'Approved', 'bwereh02@gmail.com', 'Bright Kelvin', 'Wereh', 'Dr', NULL, 'Sent', 'retrospective review', FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.protocols WHERE serial_text = '2026/379');

INSERT INTO public.protocols (serial_text, title, approved_title, study_type, submission_type, degree, fast_tracked, submitted_at, final_outcome, meeting_date, meeting_outcome, applicant_email, applicant_firstname, applicant_surname, applicant_title, amendment_letter_status, approval_letter_status, list_amendments, omit_record)
SELECT '2026/380', 'Biobrane® Revisited – Contemporary Usage Of Biobrane® In Burn And Non-Burn Wounds In A Lower- And Middle-Income Country (Lmic)', 'Biobrane® Revisited – Contemporary Usage Of Biobrane® In Burn And Non-Burn Wounds In A Lower- And Middle-Income Country (Lmic)', NULL, NULL, NULL, TRUE, '2026-05-12T09:47:50', 'approved', '2026-05-15', 'Approved', 'saleigh.adams@uct.ac.za', 'Saleigh', 'Adams', 'Prof', NULL, 'Sent', 'retrospective review', FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.protocols WHERE serial_text = '2026/380');

INSERT INTO public.protocols (serial_text, title, approved_title, study_type, submission_type, degree, fast_tracked, submitted_at, final_outcome, meeting_date, meeting_outcome, applicant_email, applicant_firstname, applicant_surname, applicant_title, amendment_letter_status, approval_letter_status, list_amendments, omit_record)
SELECT '2026/381', 'Prevalence Of Internationally Recognised Physiological Predictors Of Mortality At Presentation Among Acute Care Surgery Mortalities In A Tertiary Hospital In Cape Town, South Africa', 'Prevalence Of Internationally Recognised Physiological Predictors Of Mortality At Presentation Among Acute Care Surgery Mortalities In A Tertiary Hospital In Cape Town, South Africa', NULL, NULL, NULL, FALSE, '2026-05-12T19:14:22', 'pending', '2026-06-12', 'Pending', 'humeshen@gmail.com', 'Humeshen', 'Naidoo', 'Dr', 'Pending', 'Pending', 'Fast-track reject. Asking for consent waiver.', FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.protocols WHERE serial_text = '2026/381');

INSERT INTO public.protocols (serial_text, title, approved_title, study_type, submission_type, degree, fast_tracked, submitted_at, final_outcome, meeting_date, meeting_outcome, applicant_email, applicant_firstname, applicant_surname, applicant_title, amendment_letter_status, approval_letter_status, list_amendments, omit_record)
SELECT '2026/382', 'Mucous Cysts – Outcomes Of Arthrotomy And Debridement, Without Excision Of The Cyst', 'Mucous Cysts – Outcomes Of Arthrotomy And Debridement, Without Excision Of The Cyst', NULL, NULL, NULL, FALSE, NULL, 'pending', '2026-06-05', NULL, 'bradbonner@hotmail.com', 'Bradley', 'Bonner', 'Dr', NULL, NULL, NULL, FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.protocols WHERE serial_text = '2026/382');

INSERT INTO public.protocols (serial_text, title, approved_title, study_type, submission_type, degree, fast_tracked, submitted_at, final_outcome, meeting_date, meeting_outcome, applicant_email, applicant_firstname, applicant_surname, applicant_title, amendment_letter_status, approval_letter_status, list_amendments, omit_record)
SELECT '2026/383', 'Preoperative Cleft Morphology As A Predictor Of Velopharyngeal Insufficiency Requiring Secondary Palatoplasty: A Retrospective African Cohort Study', 'Preoperative Cleft Morphology As A Predictor Of Velopharyngeal Insufficiency Requiring Secondary Palatoplasty: A Retrospective African Cohort Study', NULL, NULL, NULL, FALSE, NULL, 'approved', '2026-06-05', 'Approved', 'saleigh.adams@uct.ac.za', 'Saleigh', 'Adams', 'Prof', NULL, 'Sent', 'retrospective review', FALSE
WHERE NOT EXISTS (SELECT 1 FROM public.protocols WHERE serial_text = '2026/383');

COMMIT;

-- New protocols (> 2026/371): 12
-- Skipped (<= 2026/371, already imported): 1216
-- Skipped (blank serial_text): 399
-- Skipped (unparseable serial_text): 161
