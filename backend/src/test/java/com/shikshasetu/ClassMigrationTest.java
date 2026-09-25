package com.shikshasetu;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.flywaydb.core.Flyway;
import org.h2.jdbcx.JdbcDataSource;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * V4–V6 move existing data into the school/class model. This builds a database as it looked
 * before (schema V3: students pointing straight at a teacher, whole-class assignments without a
 * student), runs the remaining migrations and checks that every relationship survived —
 * on H2 (local development) and on real PostgreSQL.
 */
class ClassMigrationTest {

    @Test
    void migratesExistingTeacherStudentLinksOnH2() throws Exception {
        JdbcDataSource h2 = new JdbcDataSource();
        h2.setURL("jdbc:h2:mem:classmig-" + UUID.randomUUID()
                + ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_DELAY=-1");
        h2.setUser("sa");
        migrateAndVerify(h2);
    }

    @Test
    void migratesExistingTeacherStudentLinksOnPostgres() throws Exception {
        try (EmbeddedPostgres pg = EmbeddedPostgres.start()) {
            migrateAndVerify(pg.getPostgresDatabase());
        }
    }

    private void migrateAndVerify(DataSource ds) throws SQLException {
        Flyway.configure().dataSource(ds).locations("classpath:db/migration").target("3").load().migrate();

        try (Connection c = ds.getConnection(); Statement st = c.createStatement()) {
            long sunita = user(st, "Sunita", "TEACHER");
            long ravi = user(st, "Ravi", "TEACHER");
            long a = user(st, "Aarav", "STUDENT");
            long p = user(st, "Priya", "STUDENT");
            long k = user(st, "Kiran", "STUDENT");
            long loner = user(st, "Loner", "STUDENT");
            profile(st, a, sunita, "Govt. High School, Sundargarh", "Sundargarh, Odisha", 8);
            profile(st, p, sunita, "Govt. High School, Sundargarh", "Sundargarh, Odisha", 8);
            profile(st, k, ravi, null, null, 7);
            profile(st, loner, null, null, null, 9);

            st.executeUpdate("insert into subjects (code, name) values ('math', 'Mathematics')");
            long subject = id(st, "select id from subjects where code = 'math'");
            st.executeUpdate("insert into chapters (subject_id, title, position) values (" + subject + ", 'Ch', 1)");
            long chapter = id(st, "select id from chapters");
            st.executeUpdate("insert into lessons (chapter_id, title, topic, content, duration_minutes, position) values ("
                    + chapter + ", 'L', 'topic', 'body', 5, 1)");
            long lesson = id(st, "select id from lessons");
            st.executeUpdate("insert into assignments (teacher_id, student_id, lesson_id, title, created_at) values ("
                    + sunita + ", null, " + lesson + ", 'Whole class', current_timestamp)");
            st.executeUpdate("insert into assignments (teacher_id, student_id, lesson_id, title, created_at) values ("
                    + sunita + ", " + a + ", " + lesson + ", 'Just Aarav', current_timestamp)");
        }

        Flyway.configure().dataSource(ds).locations("classpath:db/migration").load().migrate();

        try (Connection c = ds.getConnection(); Statement st = c.createStatement()) {
            // One class per teacher, at the school the students named (or a placeholder)
            assertThat(id(st, "select count(*) from classrooms")).isEqualTo(2);
            long sunitaClass = id(st, "select c.id from classrooms c join users u on u.id = c.teacher_id where u.name = 'Sunita'");
            long raviClass = id(st, "select c.id from classrooms c join users u on u.id = c.teacher_id where u.name = 'Ravi'");
            assertThat(text(st, "select name from classrooms where id = " + sunitaClass)).isEqualTo("Class 8 – Section A");
            assertThat(text(st, "select s.name from schools s join classrooms c on c.school_id = s.id where c.id = " + sunitaClass))
                    .isEqualTo("Govt. High School, Sundargarh");
            assertThat(text(st, "select s.name from schools s join classrooms c on c.school_id = s.id where c.id = " + raviClass))
                    .isEqualTo("Ravi's school");

            // Students kept their teacher, now through their class
            assertThat(classOf(st, "Aarav")).isEqualTo(sunitaClass);
            assertThat(classOf(st, "Priya")).isEqualTo(sunitaClass);
            assertThat(classOf(st, "Kiran")).isEqualTo(raviClass);
            assertThat(classOf(st, "Loner")).isNull();

            // Whole-class work now targets the class; personal work still targets the student
            assertThat(id(st, "select classroom_id from assignments where title = 'Whole class'")).isEqualTo(sunitaClass);
            assertThat(id(st, "select count(*) from assignments where title = 'Just Aarav' and classroom_id is null")).isEqualTo(1);

            // Join codes are 6 unambiguous characters and unique
            List<String> codes = new ArrayList<>();
            try (ResultSet rs = st.executeQuery("select join_code from classrooms")) {
                while (rs.next()) codes.add(rs.getString(1));
            }
            assertThat(codes).allMatch(code -> code.matches("[A-HJKMNP-Z2-9]{6}")).doesNotHaveDuplicates();

            // The old direct link is gone and every assignment must have exactly one target
            assertThatThrownBy(() -> st.executeQuery("select teacher_id from student_profiles")).isInstanceOf(SQLException.class);
            long anyLesson = id(st, "select id from lessons");
            long sunita = id(st, "select id from users where name = 'Sunita'");
            assertThatThrownBy(() -> st.executeUpdate("insert into assignments (teacher_id, lesson_id, title, created_at) values ("
                    + sunita + ", " + anyLesson + ", 'No target', current_timestamp)")).isInstanceOf(SQLException.class);
        }
    }

    // ------------------------------------------------------------------ helpers

    private static long user(Statement st, String name, String role) throws SQLException {
        st.executeUpdate("insert into users (email, password_hash, name, role, active, created_at) values ('"
                + name.toLowerCase() + "@example.com', 'x', '" + name + "', '" + role + "', true, current_timestamp)");
        return id(st, "select id from users where name = '" + name + "'");
    }

    private static void profile(Statement st, long userId, Long teacherId, String school, String district, int grade)
            throws SQLException {
        st.executeUpdate("insert into student_profiles (user_id, teacher_id, school, district, grade_level, onboarded, xp, "
                + "current_streak, longest_streak) values (" + userId + ", " + teacherId + ", "
                + (school == null ? "null" : "'" + school + "'") + ", " + (district == null ? "null" : "'" + district + "'")
                + ", " + grade + ", true, 0, 0, 0)");
    }

    private static Long classOf(Statement st, String name) throws SQLException {
        try (ResultSet rs = st.executeQuery("select p.classroom_id from student_profiles p join users u on u.id = p.user_id "
                + "where u.name = '" + name + "'")) {
            rs.next();
            long v = rs.getLong(1);
            return rs.wasNull() ? null : v;
        }
    }

    private static long id(Statement st, String sql) throws SQLException {
        try (ResultSet rs = st.executeQuery(sql)) {
            rs.next();
            return rs.getLong(1);
        }
    }

    private static String text(Statement st, String sql) throws SQLException {
        try (ResultSet rs = st.executeQuery(sql)) {
            rs.next();
            return rs.getString(1);
        }
    }
}
