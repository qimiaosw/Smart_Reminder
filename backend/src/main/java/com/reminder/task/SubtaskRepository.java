package com.reminder.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SubtaskRepository extends JpaRepository<SubtaskEntity, String> {

    List<SubtaskEntity> findByTaskIdOrderBySortOrder(String taskId);

    long countByTaskIdAndCompletedTrue(String taskId);
}
