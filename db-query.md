-- =========================================================
-- SUPABASE / POSTGRESQL
-- CREATE TABLE SAJA
-- Struktur dibuat semirip mungkin dengan MySQL
-- agar perubahan Sequelize / Express.js seminimal mungkin.
-- =========================================================

-- 1. ROLE
CREATE TABLE role (
    role_id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    alias CHAR(10) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 2. PROGRAM TRAINING
CREATE TABLE program_training (
    program_training_id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    alias CHAR(4) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 3. STAFF
CREATE TABLE staff (
    staff_id VARCHAR(36) PRIMARY KEY,
    role_id INTEGER NOT NULL,
    username VARCHAR(64) NOT NULL,
    name VARCHAR(64) NOT NULL,
    email VARCHAR(64) NOT NULL,
    password VARCHAR(64) NOT NULL,
    status_deleted SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT staff_role_fk
        FOREIGN KEY (role_id)
        REFERENCES role(role_id)
);


-- 4. PARTICIPANT
CREATE TABLE participant (
    participant_id VARCHAR(36) PRIMARY KEY,
    agency VARCHAR(64) NOT NULL,
    name VARCHAR(64) NOT NULL,
    domicile VARCHAR(60) NOT NULL,
    email VARCHAR(64) NOT NULL,
    status_deleted SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 5. TRAINING SESI
CREATE TABLE training_sesi (
    training_sesi_id VARCHAR(36) PRIMARY KEY,
    program_training_id VARCHAR(36) NOT NULL,
    staff_id VARCHAR(36) NOT NULL,
    name VARCHAR(64) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    location VARCHAR(64) NOT NULL,
    status_active VARCHAR(20) NOT NULL,
    meeting_mode VARCHAR(20) NOT NULL,
    status_deleted SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT training_sesi_staff_fk
        FOREIGN KEY (staff_id)
        REFERENCES staff(staff_id),

    CONSTRAINT training_sesi_program_fk
        FOREIGN KEY (program_training_id)
        REFERENCES program_training(program_training_id)
);


-- 6. MEETING
CREATE TABLE meeting (
    meeting_id VARCHAR(36) PRIMARY KEY,
    training_sesi_id VARCHAR(36) NOT NULL,
    name VARCHAR(64) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT meeting_training_fk
        FOREIGN KEY (training_sesi_id)
        REFERENCES training_sesi(training_sesi_id)
);


-- 7. PARTICIPANT TRAINING
CREATE TABLE participant_training (
    participant_training_id VARCHAR(36) PRIMARY KEY,
    participant_id VARCHAR(36) NOT NULL,
    training_sesi_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT participant_training_participant_fk
        FOREIGN KEY (participant_id)
        REFERENCES participant(participant_id),

    CONSTRAINT participant_training_training_fk
        FOREIGN KEY (training_sesi_id)
        REFERENCES training_sesi(training_sesi_id)
);


-- 8. PRESENT
CREATE TABLE present (
    present_id VARCHAR(36) PRIMARY KEY,
    meeting_id VARCHAR(36),
    participant_id VARCHAR(36),
    status_present VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT present_meeting_fk
        FOREIGN KEY (meeting_id)
        REFERENCES meeting(meeting_id),

    CONSTRAINT present_participant_fk
        FOREIGN KEY (participant_id)
        REFERENCES participant(participant_id)
);


-- 9. OTP VERIFY
CREATE TABLE otp_verify (
    id_otp VARCHAR(36) PRIMARY KEY,
    staff_id VARCHAR(36) NOT NULL,
    otp VARCHAR(64) NOT NULL,
    status SMALLINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT otp_staff_fk
        FOREIGN KEY (staff_id)
        REFERENCES staff(staff_id)
);


-- 10. REPORT TYPE
CREATE TABLE report_type (
    report_type_id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 11. REPORT SCHEDULE
CREATE TABLE report_schedule (
    report_schedule_id VARCHAR(36) PRIMARY KEY,
    training_sesi_id VARCHAR(36) NOT NULL,
    report_type_id VARCHAR(36) NOT NULL,
    meeting_id VARCHAR(36) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT report_schedule_training_fk
        FOREIGN KEY (training_sesi_id)
        REFERENCES training_sesi(training_sesi_id),

    CONSTRAINT report_schedule_type_fk
        FOREIGN KEY (report_type_id)
        REFERENCES report_type(report_type_id),

    CONSTRAINT report_schedule_meeting_fk
        FOREIGN KEY (meeting_id)
        REFERENCES meeting(meeting_id)
);


-- 12. REPORT
CREATE TABLE report (
    report_id VARCHAR(36) PRIMARY KEY,
    training_sesi_id VARCHAR(36) NOT NULL,
    report_schedule_id VARCHAR(36) NOT NULL,
    staff_id VARCHAR(36) NOT NULL,
    name VARCHAR(64) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    finish_time TIMESTAMP NOT NULL,
    author_acc VARCHAR(36) NOT NULL,
    status_acc VARCHAR(20) NOT NULL,
    acc_director_by VARCHAR(36) NOT NULL,
    acc_director_status VARCHAR(20) NOT NULL,
    status_delete SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT report_staff_fk
        FOREIGN KEY (staff_id)
        REFERENCES staff(staff_id),

    CONSTRAINT report_training_fk
        FOREIGN KEY (training_sesi_id)
        REFERENCES training_sesi(training_sesi_id),

    CONSTRAINT report_schedule_fk
        FOREIGN KEY (report_schedule_id)
        REFERENCES report_schedule(report_schedule_id)
);


-- 13. REPORT CONTENT
CREATE TABLE report_content (
    report_content_id VARCHAR(36) PRIMARY KEY,
    report_type_id VARCHAR(36) NOT NULL,
    content_name VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT report_content_type_fk
        FOREIGN KEY (report_type_id)
        REFERENCES report_type(report_type_id)
);


-- 14. REPORT DETAIL
CREATE TABLE report_detail (
    report_detail_id VARCHAR(36) PRIMARY KEY,
    report_content_id VARCHAR(36) NOT NULL,
    report_id VARCHAR(36) NOT NULL,
    content_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT report_detail_report_fk
        FOREIGN KEY (report_id)
        REFERENCES report(report_id),

    CONSTRAINT report_detail_content_fk
        FOREIGN KEY (report_content_id)
        REFERENCES report_content(report_content_id)
);


-- 15. ATTACHMENT
CREATE TABLE attachment (
    attachment_id VARCHAR(36) PRIMARY KEY,
    report_id VARCHAR(36),
    status_delete SMALLINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT attachment_report_fk
        FOREIGN KEY (report_id)
        REFERENCES report(report_id)
);


-- =========================================================
-- INDEX
-- =========================================================

CREATE INDEX idx_staff_role
    ON staff(role_id);

CREATE INDEX idx_training_sesi_staff
    ON training_sesi(staff_id);

CREATE INDEX idx_training_sesi_program
    ON training_sesi(program_training_id);

CREATE INDEX idx_meeting_training
    ON meeting(training_sesi_id);

CREATE INDEX idx_participant_training_participant
    ON participant_training(participant_id);

CREATE INDEX idx_participant_training_training
    ON participant_training(training_sesi_id);

CREATE INDEX idx_present_participant
    ON present(participant_id);

CREATE INDEX idx_present_meeting
    ON present(meeting_id);

CREATE INDEX idx_otp_staff
    ON otp_verify(staff_id);

CREATE INDEX idx_report_training
    ON report(training_sesi_id);

CREATE INDEX idx_report_staff
    ON report(staff_id);

CREATE INDEX idx_report_schedule
    ON report(report_schedule_id);

CREATE INDEX idx_report_content_type
    ON report_content(report_type_id);

CREATE INDEX idx_report_detail_report
    ON report_detail(report_id);

CREATE INDEX idx_report_detail_content
    ON report_detail(report_content_id);

CREATE INDEX idx_report_schedule_training
    ON report_schedule(training_sesi_id);

CREATE INDEX idx_report_schedule_type
    ON report_schedule(report_type_id);

CREATE INDEX idx_report_schedule_meeting
    ON report_schedule(meeting_id);

CREATE INDEX idx_attachment_report
    ON attachment(report_id);