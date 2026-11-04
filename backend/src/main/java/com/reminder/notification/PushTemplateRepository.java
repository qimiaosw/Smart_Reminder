package com.reminder.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PushTemplateRepository extends JpaRepository<PushTemplateEntity, String> {

    List<PushTemplateEntity> findByIsActiveTrue();

    List<PushTemplateEntity> findByTargetUserTypeAndIsActiveTrue(String userType);

    List<PushTemplateEntity> findByTargetUserTypeIsNullAndIsActiveTrue();
}
