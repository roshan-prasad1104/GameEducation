-- Translated curriculum text (Hindi, Odia, Telugu). English stays in the main tables and is
-- the fallback; order, answer keys, topics and durations are shared across languages.

create table subject_translations (
    subject_id  bigint      not null,
    language    varchar(8)  not null,
    name        varchar(200) not null,
    description varchar(800),
    primary key (subject_id, language),
    constraint fk_subject_translations_subject foreign key (subject_id) references subjects (id)
);

create table chapter_translations (
    chapter_id  bigint       not null,
    language    varchar(8)   not null,
    title       varchar(300) not null,
    description varchar(800),
    primary key (chapter_id, language),
    constraint fk_chapter_translations_chapter foreign key (chapter_id) references chapters (id)
);

create table lesson_translations (
    lesson_id bigint         not null,
    language  varchar(8)     not null,
    title     varchar(300)   not null,
    summary   varchar(800),
    content   varchar(40000) not null,
    primary key (lesson_id, language),
    constraint fk_lesson_translations_lesson foreign key (lesson_id) references lessons (id)
);

create table quiz_translations (
    quiz_id     bigint       not null,
    language    varchar(8)   not null,
    title       varchar(300) not null,
    description varchar(800),
    primary key (quiz_id, language),
    constraint fk_quiz_translations_quiz foreign key (quiz_id) references quizzes (id)
);

create table question_translations (
    question_id bigint        not null,
    language    varchar(8)    not null,
    prompt      varchar(2000) not null,
    explanation varchar(2000),
    primary key (question_id, language),
    constraint fk_question_translations_question foreign key (question_id) references questions (id)
);

create table question_option_translations (
    question_id  bigint       not null,
    language     varchar(8)   not null,
    option_index integer      not null,
    option_text  varchar(800) not null,
    constraint uk_question_option_translations unique (question_id, language, option_index),
    constraint fk_question_option_translations_question foreign key (question_id) references questions (id)
);
