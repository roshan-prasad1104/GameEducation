-- After V5 every student with a teacher is in that teacher's class, so the direct link goes
-- (the foreign key and index on the column are dropped with it).
alter table student_profiles drop column teacher_id;

-- Every assignment targets exactly one student or one class.
alter table assignments add constraint ck_assignments_target
    check ((student_id is null and classroom_id is not null) or (student_id is not null and classroom_id is null));
