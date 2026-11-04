package com.reminder.event;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BehaviorEventRepository extends JpaRepository<BehaviorEventEntity, Long> {
}
