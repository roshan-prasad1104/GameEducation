package com.shikshasetu.school;

import jakarta.validation.constraints.*;

import java.util.List;

public final class SchoolDtos {
    private SchoolDtos() {}

    public record SchoolInput(@NotBlank(message = "School name is required") @Size(max = 160) String name,
                              @Size(max = 120) String district) {}

    public record ClassInput(@NotNull(message = "Choose a school") Long schoolId,
                             @NotBlank(message = "Class name is required") @Size(max = 80) String name,
                             @Min(6) @Max(12) Integer gradeLevel,
                             Long teacherId) {}

    public record JoinClassRequest(@NotBlank(message = "Enter the class code") @Size(max = 12) String joinCode) {}

    public record ClassView(Long id, Long schoolId, String schoolName, String district, String name, Integer gradeLevel,
                            Long teacherId, String teacherName, String joinCode, long studentCount) {}

    public record SchoolView(Long id, String name, String district, List<ClassView> classes) {}
}
