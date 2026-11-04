package com.reminder.abtest;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExperimentRepository extends JpaRepository<ExperimentEntity, Long> {

    List<ExperimentEntity> findByOrderByCreatedAtDesc();

    List<ExperimentEntity> findByStatus(String status);
}
