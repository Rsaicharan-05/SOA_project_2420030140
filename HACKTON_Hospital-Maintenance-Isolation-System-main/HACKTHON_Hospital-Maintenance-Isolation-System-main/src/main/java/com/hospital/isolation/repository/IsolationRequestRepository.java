package com.hospital.isolation.repository;

import com.hospital.isolation.model.IsolationRequest;
import com.hospital.isolation.model.IsolationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IsolationRequestRepository extends JpaRepository<IsolationRequest, Long> {
    Optional<IsolationRequest> findByRequestNumber(String requestNumber);
    List<IsolationRequest> findByStatus(IsolationStatus status);
    List<IsolationRequest> findByValveId(Long valveId);
}
