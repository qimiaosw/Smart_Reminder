package com.reminder.abtest;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AssignmentRepository extends JpaRepository<AssignmentEntity, Long> {

    Optional<AssignmentEntity> findByUserIdAndExperimentId(String userId, Long experimentId);

    long countByExperimentIdAndGroupName(Long experimentId, String groupName);

    @Query("SELECT a.userId FROM AssignmentEntity a WHERE a.experimentId = :experimentId AND a.groupName = :groupName")
    List<String> findUserIdsByExperimentIdAndGroupName(@Param("experimentId") Long experimentId, @Param("groupName") String groupName);

    List<AssignmentEntity> findByExperimentId(Long experimentId);
}
