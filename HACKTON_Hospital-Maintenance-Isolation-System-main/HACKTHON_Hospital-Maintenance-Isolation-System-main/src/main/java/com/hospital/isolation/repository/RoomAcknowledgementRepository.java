package com.hospital.isolation.repository;

import com.hospital.isolation.model.RoomAcknowledgement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomAcknowledgementRepository extends JpaRepository<RoomAcknowledgement, Long> {
    List<RoomAcknowledgement> findByIsolationRequestId(Long isolationRequestId);
    Optional<RoomAcknowledgement> findByIsolationRequestIdAndRoomId(Long isolationRequestId, Long roomId);
}
