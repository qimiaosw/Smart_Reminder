package com.reminder.abtest;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExperimentGroupRepository extends JpaRepository<ExperimentGroupEntity, Long> {

    List<ExperimentGroupEntity> findByExperimentId(Long experimentId);

    Optional<ExperimentGroupEntity> findByExperimentIdAndGroupName(Long experimentId, String groupName);
}
