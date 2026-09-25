package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

import java.security.SecureRandom;
import java.sql.*;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;

/**
 * Data migration for the school/class model. Before it, a student pointed straight at a teacher
 * (student_profiles.teacher_id) and a whole-class assignment was one with no student. For every
 * teacher who has students or whole-class assignments this creates one class at the school most
 * of those students named (created if needed), moves the students into it and points the
 * teacher's whole-class assignments at it. Written in Java so join codes come from SecureRandom,
 * and in plain JDBC so it runs on both PostgreSQL and H2. No-op on a new, empty database.
 */
public class V5__Move_students_into_classes extends BaseJavaMigration {
    private static final String CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private final SecureRandom random = new SecureRandom();

    @Override
    public void migrate(Context context) throws SQLException {
        Connection db = context.getConnection();
        Set<Long> teachers = new TreeSet<>();
        try (Statement st = db.createStatement();
             ResultSet rs = st.executeQuery(
                     "select teacher_id from student_profiles where teacher_id is not null " +
                     "union select teacher_id from assignments where student_id is null")) {
            while (rs.next()) teachers.add(rs.getLong(1));
        }
        for (Long teacherId : teachers) migrateTeacher(db, teacherId);
    }

    private void migrateTeacher(Connection db, long teacherId) throws SQLException {
        // The school and grade most of this teacher's students gave (ties: alphabetical).
        Map<String, Integer> schoolVotes = new TreeMap<>();
        Map<String, String> districtOf = new HashMap<>();
        Map<Integer, Integer> gradeVotes = new TreeMap<>();
        try (PreparedStatement ps = db.prepareStatement(
                "select school, district, grade_level from student_profiles where teacher_id = ?")) {
            ps.setLong(1, teacherId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String school = rs.getString(1);
                    if (school != null && !school.isBlank()) {
                        schoolVotes.merge(school.trim(), 1, Integer::sum);
                        districtOf.putIfAbsent(school.trim(), rs.getString(2));
                    }
                    int grade = rs.getInt(3);
                    if (!rs.wasNull()) gradeVotes.merge(grade, 1, Integer::sum);
                }
            }
        }
        String teacherName = "Teacher";
        try (PreparedStatement ps = db.prepareStatement("select name from users where id = ?")) {
            ps.setLong(1, teacherId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) teacherName = rs.getString(1);
            }
        }
        String schoolName = top(schoolVotes).orElse(teacherName + "'s school");
        String district = districtOf.get(schoolName);
        Integer grade = top(gradeVotes).orElse(null);

        long schoolId = findOrCreateSchool(db, schoolName, district);
        long classId;
        try (PreparedStatement ps = db.prepareStatement(
                "insert into classrooms (school_id, name, grade_level, teacher_id, join_code, created_at) values (?, ?, ?, ?, ?, ?)",
                new String[]{"id"})) {
            ps.setLong(1, schoolId);
            ps.setString(2, grade == null ? "Section A" : "Class " + grade + " – Section A");
            if (grade == null) ps.setNull(3, Types.INTEGER); else ps.setInt(3, grade);
            ps.setLong(4, teacherId);
            ps.setString(5, uniqueCode(db));
            ps.setObject(6, OffsetDateTime.now(ZoneOffset.UTC));
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                keys.next();
                classId = keys.getLong(1);
            }
        }
        try (PreparedStatement ps = db.prepareStatement("update student_profiles set classroom_id = ? where teacher_id = ?")) {
            ps.setLong(1, classId);
            ps.setLong(2, teacherId);
            ps.executeUpdate();
        }
        try (PreparedStatement ps = db.prepareStatement(
                "update assignments set classroom_id = ? where teacher_id = ? and student_id is null")) {
            ps.setLong(1, classId);
            ps.setLong(2, teacherId);
            ps.executeUpdate();
        }
    }

    private static long findOrCreateSchool(Connection db, String name, String district) throws SQLException {
        try (PreparedStatement ps = db.prepareStatement(district == null
                ? "select id from schools where name = ? and district is null"
                : "select id from schools where name = ? and district = ?")) {
            ps.setString(1, name);
            if (district != null) ps.setString(2, district);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getLong(1);
            }
        }
        try (PreparedStatement ps = db.prepareStatement("insert into schools (name, district) values (?, ?)", new String[]{"id"})) {
            ps.setString(1, name);
            ps.setString(2, district);
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                keys.next();
                return keys.getLong(1);
            }
        }
    }

    private String uniqueCode(Connection db) throws SQLException {
        while (true) {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) sb.append(CODE_ALPHABET.charAt(random.nextInt(CODE_ALPHABET.length())));
            try (PreparedStatement ps = db.prepareStatement("select count(*) from classrooms where join_code = ?")) {
                ps.setString(1, sb.toString());
                try (ResultSet rs = ps.executeQuery()) {
                    rs.next();
                    if (rs.getLong(1) == 0) return sb.toString();
                }
            }
        }
    }

    private static <K> Optional<K> top(Map<K, Integer> votes) {
        return votes.entrySet().stream().max(Map.Entry.<K, Integer>comparingByValue()
                .thenComparing(Map.Entry.comparingByKey((a, b) -> String.valueOf(b).compareTo(String.valueOf(a)))))
                .map(Map.Entry::getKey);
    }
}
