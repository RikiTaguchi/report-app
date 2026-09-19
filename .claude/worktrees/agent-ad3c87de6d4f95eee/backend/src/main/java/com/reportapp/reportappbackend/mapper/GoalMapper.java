package com.reportapp.reportappbackend.mapper;

import com.reportapp.reportappbackend.entity.Goal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.apache.ibatis.annotations.Param;

public interface GoalMapper {

    Optional<Goal> findById(@Param("id") UUID id);

    List<Goal> findByStudentId(@Param("studentId") UUID studentId);

    boolean existsOverlapping(
            @Param("studentId") UUID studentId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("excludeGoalId") UUID excludeGoalId);

    boolean existsCoveringDate(@Param("studentId") UUID studentId, @Param("date") LocalDate date);

    void insert(Goal goal);

    void update(Goal goal);

    void deleteById(@Param("id") UUID id);
}
